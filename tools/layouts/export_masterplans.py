"""
Converts the platform's approved-layout geometry (format v2, admin/src/lib/layouts/<id>.json) into the Live layouts
app's "masterplan" format (the GC VI demo's layouts/src/data/masterplans/global-city-vi.json), then checks the result.

Derived here (v2 has no such data): road centre-lines (skeleton of the road polygons, widths in feet from the distance
transform snapped to the widths printed on that layout, a printed road label on the line wins), trees (Poisson-disc in
the greens and the free strip between the wall and the plots), each plot's frontage normal `fn`, and `features`
(gate / tank / park only where v2 names them; never invented).

Run:  python -P -E tools/layouts/export_masterplans.py [--png DIR]
      Exports global-city-v, global-city-rrr and western-county, validates them, and compares centre-lines derived
      from GC VI's v2 file against the curated GC VI masterplan (which it never overwrites).
"""
import json, math, os, re, sys

import cv2
import numpy as np
from skimage.morphology import skeletonize

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
V2 = os.path.join(REPO, "admin", "src", "lib", "layouts")
OUT = os.path.join(REPO, "layouts", "src", "data", "masterplans")
EXPORT = ("global-city-v", "global-city-rrr", "western-county")

FT = 3.28084
STEP = 0.25  # raster cell, m
WIND4 = ["East", "North", "West", "South"]
WIND8 = ["East", "North-East", "North", "North-West", "West", "South-West", "South", "South-East"]


def r2(v):
    return round(float(v), 2)


def pts2(ring):
    return [[r2(x), r2(y)] for x, y in ring]


def compass(nx, ny):  # same rule as build_layouts.py, so `fn` agrees with v2's `f`
    ang = math.degrees(math.atan2(ny, nx)) % 360
    if min(ang % 90, 90 - ang % 90) <= 28:
        return WIND4[int(((ang + 45) % 360) // 90)]
    return WIND8[int(((ang + 22.5) % 360) // 45)]


def pip(pt, poly):
    x, y = pt
    inside, j = False, len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def in_polys(pt, polys):
    return any(pip(pt, p["outer"]) and not any(pip(pt, h) for h in p.get("holes", [])) for p in polys)


class Grid:
    """ENU metres <-> raster cells (row = y, so the image is upside down; only the PNG flips it)."""

    def __init__(self, rings, margin=20.0):
        P = np.array([p for r in rings for p in r], float)
        self.o = P.min(axis=0) - margin
        self.w, self.h = (np.ceil((P.max(axis=0) + margin - self.o) / STEP).astype(int) + 1).tolist()

    def px(self, ring):
        return np.round((np.array(ring, float) - self.o) / STEP).astype(np.int32)

    def xy(self, col, row):
        return [self.o[0] + col * STEP, self.o[1] + row * STEP]

    def mask(self, polys):
        """polys: [{outer, holes}] or plain rings."""
        m = np.zeros((self.h, self.w), np.uint8)
        for p in polys:
            outer, holes = (p["outer"], p.get("holes", [])) if isinstance(p, dict) else (p, [])
            cv2.fillPoly(m, [self.px(outer)], 1)
            for h in holes:
                cv2.fillPoly(m, [self.px(h)], 0)
        return m


def disk(r_m):
    k = max(1, int(round(r_m / STEP)))
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * k + 1, 2 * k + 1))


# ---------------------------------------------------------------- centre-lines

def skeleton_graph(mask):
    """Nodes (junction / end pixel clusters) and edges (pixel paths between them) of the mask's skeleton."""
    sk = skeletonize(mask.astype(bool)).astype(np.uint8)
    nb = cv2.filter2D(sk, -1, np.ones((3, 3), np.float32), borderType=cv2.BORDER_CONSTANT) - sk
    node_px = (sk == 1) & (nb != 2)
    n_nodes, lab = cv2.connectedComponents(node_px.astype(np.uint8), connectivity=8)
    lab = lab - 1  # -1 = not a node
    nodes = {}
    for i in range(n_nodes - 1):
        ys, xs = np.nonzero(lab == i)
        nodes[i] = (float(xs.mean()), float(ys.mean()))
    H, W = sk.shape
    N8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]

    def nbrs(y, x):
        for dy, dx in N8:
            yy, xx = y + dy, x + dx
            if 0 <= yy < H and 0 <= xx < W and sk[yy, xx]:
                yield yy, xx

    seen = np.zeros_like(sk, bool)
    edges = []
    for y0, x0 in zip(*np.nonzero(node_px)):
        a = lab[y0, x0]
        for y1, x1 in nbrs(y0, x0):
            if lab[y1, x1] >= 0 or seen[y1, x1]:
                continue
            path, prev, cur, end = [(x0, y0), (x1, y1)], (y0, x0), (y1, x1), None
            seen[cur] = True
            while end is None:
                nxt = None
                for q in nbrs(*cur):
                    if q == prev:
                        continue
                    if lab[q] >= 0 and (lab[q] != a or len(path) > 4):
                        end = lab[q]
                        path.append((q[1], q[0]))
                        break
                    if lab[q] < 0 and not seen[q] and nxt is None:
                        nxt = q
                if end is None:
                    if nxt is None:  # ran into its own trail: a loop with no junction on it
                        break
                    seen[nxt] = True
                    path.append((nxt[1], nxt[0]))
                    prev, cur = cur, nxt
            if end is not None:
                edges.append(dict(a=int(a), b=int(end), px=path))
    return nodes, edges


def plen(px):
    p = np.array(px, float)
    return float(np.linalg.norm(np.diff(p, axis=0), axis=1).sum()) * STEP


def prune(nodes, edges, dt):
    """Drop spurs (< 10 m, or shorter than ~1.6 x the road's half-width where they leave it: the forks a skeleton grows
    into a road end's corners), contract junction pairs a few metres apart, merge chains through degree-2 nodes."""
    changed = True
    while changed:
        changed = False
        deg = {}
        for e in edges:
            for k in (e["a"], e["b"]):
                deg[k] = deg.get(k, 0) + 1
        keep = []
        for e in edges:
            L = plen(e["px"])
            ends = [deg[e["a"]], deg[e["b"]]]
            if 1 in ends and e["a"] != e["b"]:
                j = e["b"] if deg[e["a"]] == 1 else e["a"]
                hw = dt[int(round(nodes[j][1])), int(round(nodes[j][0]))] * STEP
                if L < max(10.0, 1.6 * hw + 1.0) and (max(ends) >= 3 or L < 10.0):
                    changed = True
                    continue
            keep.append(e)
        edges = keep
        # contract short links between two junctions (a 4-way crossing skeletonises as two T's a pixel or two apart)
        deg = {}
        for e in edges:
            for k in (e["a"], e["b"]):
                deg[k] = deg.get(k, 0) + 1
        for e in edges:
            if e["a"] != e["b"] and deg.get(e["a"], 0) >= 3 and deg.get(e["b"], 0) >= 3 and plen(e["px"]) < 4.0:
                a, b = e["a"], e["b"]
                c = ((nodes[a][0] + nodes[b][0]) / 2, (nodes[a][1] + nodes[b][1]) / 2)
                nodes[a] = c
                edges.remove(e)
                for f in edges:
                    if f["a"] == b:
                        f["a"] = a
                    if f["b"] == b:
                        f["b"] = a
                changed = True
                break
        # merge through degree-2 nodes
        deg = {}
        for e in edges:
            for k in (e["a"], e["b"]):
                deg[k] = deg.get(k, 0) + 1
        for n, d in deg.items():
            if d != 2:
                continue
            two = [e for e in edges if n in (e["a"], e["b"])]
            if len(two) != 2 or two[0] is two[1]:
                continue
            e1, e2 = two
            p1 = e1["px"] if e1["b"] == n else e1["px"][::-1]
            a1 = e1["a"] if e1["b"] == n else e1["b"]
            p2 = e2["px"] if e2["a"] == n else e2["px"][::-1]
            b2 = e2["b"] if e2["a"] == n else e2["a"]
            edges.remove(e1)
            edges.remove(e2)
            edges.append(dict(a=a1, b=b2, px=p1 + p2[1:]))
            changed = True
            break
    return edges


def centerlines(doc, grid, fn):
    roads, access = doc["roads"], [dict(outer=a["xy"], holes=[]) for a in doc["access"]]
    m = grid.mask(roads + access)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, disk(0.75))  # seal digitising gaps where polygons meet
    # fill pin-holes (< 20 m2) so they do not grow skeleton loops; real islands are far bigger
    n, lab, st, _ = cv2.connectedComponentsWithStats(1 - m, connectivity=4)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] * STEP * STEP < 20:
            m[lab == i] = 1
    dt = cv2.distanceTransform(m, cv2.DIST_L2, 5)
    nodes, edges = skeleton_graph(m)
    edges = prune(nodes, edges, dt)

    printed = sorted({int(re.search(r"(\d+)", l["t"]).group(1)) for l in doc.get("roadLabels", []) if re.search(r"(\d+)\s*ft", l["t"])}
                     | {a["w"] for a in doc["access"] if a.get("w")})
    labels = []
    for l in doc.get("roadLabels", []):
        mm = re.search(r"(\d+)\s*ft", l["t"])
        if mm:
            a = math.radians(l["r"])
            labels.append((np.array(l["at"], float), np.array([math.cos(a), math.sin(a)]), int(mm.group(1))))
    acc_masks = [grid.mask([dict(outer=a["xy"])]) for a in doc["access"]]
    road_mask = grid.mask(roads)

    # where each plot's frontage meets its road: the plot's own road width (v2 `rw`) votes for the line there
    fronts = []
    for p in doc["plots"]:
        c, u = np.array(p["c"], float), np.array(fn[p["n"]], float)
        t = 0.0
        while t < 60 and pip((c + u * t).tolist(), p["xy"]):
            t += 0.25
        fronts.append(((c + u * (t + 2.5)).tolist(), p["rw"]))

    out, stats = [], dict(label_override=0, plot_vote=0)
    for e in edges:
        px = e["px"]
        # end exactly on the (possibly moved) node centres
        px = [nodes[e["a"]]] + px[1:-1] + [nodes[e["b"]]]
        P = np.array(px, np.float32).reshape(-1, 1, 2)
        simple = cv2.approxPolyDP(P, 0.5 / STEP, False).reshape(-1, 2)
        xy = [grid.xy(c, r) for c, r in simple]
        L = plen(px)
        if L < 1.0:
            continue
        ipx = np.round(np.array(px)).astype(int)
        ipx[:, 0] = ipx[:, 0].clip(0, grid.w - 1)
        ipx[:, 1] = ipx[:, 1].clip(0, grid.h - 1)
        mid = ipx[len(ipx) // 5: max(len(ipx) * 4 // 5, len(ipx) // 5 + 1)]
        width_m = 2 * float(np.median(dt[mid[:, 1], mid[:, 0]])) * STEP
        meas_ft = width_m * FT
        w = min(printed, key=lambda v: abs(v - meas_ft))
        rec = dict(id="", w=w, dir="", pts=pts2(xy))
        # outside roads (access): the polygon most of the line runs in names its width
        on_road = road_mask[ipx[:, 1], ipx[:, 0]].mean()
        share = [float(am[ipx[:, 1], ipx[:, 0]].mean()) for am in acc_masks]
        k = int(np.argmax(share)) if share else -1
        if k >= 0 and share[k] > 0.5 and share[k] > on_road:
            a = doc["access"][k]
            if a.get("w"):
                rec["w"] = a["w"]
            rec["name"] = a["name"]
        else:
            # a printed road label lying on this line, parallel to it, beats the measurement
            best = None
            P2 = np.array(xy)
            for at, u, lw in labels:
                for i in range(len(P2) - 1):
                    s0, s1 = P2[i], P2[i + 1]
                    seg = s1 - s0
                    sl = np.linalg.norm(seg)
                    if sl < 1e-6 or abs(float(np.dot(seg / sl, u))) < 0.9:
                        continue
                    t = float(np.clip(np.dot(at - s0, seg) / sl ** 2, 0, 1))
                    d = float(np.linalg.norm(at - (s0 + t * seg)))
                    if d < width_m / 2 + 3 and (best is None or d < best[0]):
                        best = (d, lw)
            # else the plots fronting it (their widths come from the printed labels too): drawings are not always
            # drawn to width (GC V draws its 33 ft boulevard carriageways as wide as its 30 ft roads)
            votes = [w for q, w in fronts if seg_dir(xy, q)[0] < width_m / 2 + 2]
            vote = max(set(votes), key=votes.count) if votes else None
            if best and best[1] != rec["w"]:
                stats["label_override"] += 1
                rec["w"] = best[1]
            elif not best and vote and votes.count(vote) * 2 > len(votes) and vote != rec["w"]:
                stats["plot_vote"] += 1
                rec["w"] = vote
        dx, dy = xy[-1][0] - xy[0][0], xy[-1][1] - xy[0][1]
        rec["dir"] = "R100" if rec.get("name") and rec["w"] >= 100 else ("NS" if abs(dy) >= abs(dx) else "EW")
        rec["_len"] = L
        out.append(rec)
    out.sort(key=lambda c: ("name" in c, -c["_len"]))
    ni = nx = 0
    for c in out:
        del c["_len"]
        if "name" in c:
            nx += 1
            c["id"] = f"x{nx}"
        else:
            ni += 1
            c["id"] = f"r{ni}"
    stats["printed"] = printed
    return out, stats


# ---------------------------------------------------------------- trees

def trees(doc, grid, avoid_pts, seed=7, spacing=6.5, strip=15.0, clear=1.8):
    roads = doc["roads"] + [dict(outer=a["xy"]) for a in doc["access"]]
    parks = [z["xy"] for z in doc["zones"] if "park" in z["name"].lower()]
    other_zones = [z["xy"] for z in doc["zones"] if "park" not in z["name"].lower()]
    bnd = grid.mask([doc["boundary"]])
    built = grid.mask([p["xy"] for p in doc["plots"]] + roads)
    green = grid.mask(doc["greens"] + parks) & bnd
    to_wall = cv2.distanceTransform(bnd, cv2.DIST_L2, 5) * STEP
    free = bnd & (to_wall < strip).astype(np.uint8) & (1 - grid.mask(doc["greens"] + parks + other_zones))
    ok = (green | free) & (1 - cv2.dilate(built, disk(clear))) & (1 - cv2.dilate(grid.mask(other_zones), disk(1.0)))
    ok = cv2.erode(ok, disk(0.5))  # keep crowns off the wall line and the zone edges
    ys, xs = np.nonzero(ok)
    if not len(xs):
        return []
    rng = np.random.default_rng(seed)
    cell = spacing / math.sqrt(2)
    hashp = {}
    got = []
    tries = int(len(xs) * STEP * STEP / spacing ** 2 * 30) + 100
    for i in rng.integers(0, len(xs), tries):  # dart throwing on the allowed cells: a Poisson-disc set
        x, y = grid.xy(xs[i] + rng.uniform(-0.5, 0.5), ys[i] + rng.uniform(-0.5, 0.5))
        if any(math.dist((x, y), a) < 6.0 for a in avoid_pts):
            continue
        gx, gy = int(x // cell), int(y // cell)
        if any(math.dist((x, y), q) < spacing for dx in (-2, -1, 0, 1, 2) for dy in (-2, -1, 0, 1, 2) for q in hashp.get((gx + dx, gy + dy), ())):
            continue
        hashp.setdefault((gx, gy), []).append((x, y))
        got.append([r2(x), r2(y), round(float(rng.uniform(0.8, 1.25)), 2), 0])
    got.sort(key=lambda t: (t[1], t[0]))
    return got


# ---------------------------------------------------------------- plots

def frontage_normals(doc):
    """The outward unit normal of each plot's frontage edge: the edge facing a road whose compass direction is v2's
    `f`; internal roads before outside roads, then the shorter edge (the build's own ordering)."""
    roads = doc["roads"]
    acc = [dict(outer=a["xy"]) for a in doc["access"]]
    out, fallback = {}, []
    for p in doc["plots"]:
        r, c = p["xy"], np.mean(np.array(p["xy"], float), axis=0)
        cands, every = [], []
        for i in range(len(r)):
            a, b = np.array(r[i], float), np.array(r[(i + 1) % len(r)], float)
            L = float(np.linalg.norm(b - a))
            if L < 1e-6:
                continue
            e = (b - a) / L
            nrm = np.array([e[1], -e[0]])
            mid = (a + b) / 2
            if np.dot(nrm, mid - c) < 0:
                nrm = -nrm
            every.append(nrm)
            if L < 4.0:
                continue
            for reach in (2.5, 4.5):
                probe = (mid + nrm * reach).tolist()
                on_int = in_polys(probe, roads)
                if on_int or in_polys(probe, acc):
                    cands.append((not on_int, L, nrm))
                    break
        cands.sort(key=lambda t: (t[0], t[1]))
        hit = next((n for _, _, n in cands if compass(*n) == p["f"]), None)
        if hit is None:
            fallback.append(p["n"])
            k = (WIND8.index(p["f"]) * 45) if p["f"] in WIND8 else 0
            want = np.array([math.cos(math.radians(k)), math.sin(math.radians(k))])
            hit = max(every, key=lambda n: float(np.dot(n, want)))
        out[p["n"]] = [round(float(hit[0]), 3), round(float(hit[1]), 3)]
    return out, fallback


# ---------------------------------------------------------------- export

LAND_KEYS = [("plotted", ("plotted",)), ("roads", ("road",)), ("park", ("park", "open space")), ("social", ("social",)), ("utility", ("utilit",))]


def land_use(doc):
    lu = {k: 0.0 for k, _ in LAND_KEYS}
    for row in doc["landUse"]:
        lab = row["label"].lower()
        k = next((k for k, needles in LAND_KEYS if any(n in lab for n in needles)), None)
        assert k, f"unmapped land-use row {row['label']!r}"
        lu[k] = round(lu[k] + row["sqyd"], 2)
    lu.update(net=doc["landTotal"], unit="sq yd", totalPlots=doc["plotCount"], totalArea=doc["landArea"])
    return lu


def seg_dir(line, at):
    """Unit direction of the polyline segment nearest `at`, and the distance to it."""
    best = None
    for i in range(len(line) - 1):
        a, b = np.array(line[i], float), np.array(line[i + 1], float)
        s = b - a
        t = float(np.clip(np.dot(np.array(at) - a, s) / max(np.dot(s, s), 1e-9), 0, 1))
        d = float(np.linalg.norm(np.array(at) - (a + t * s)))
        if best is None or d < best[0]:
            best = (d, s / max(np.linalg.norm(s), 1e-9))
    return best


def export(doc):
    grid = Grid([doc["boundary"]] + [a["xy"] for a in doc["access"]] + [r["outer"] for r in doc["roads"]])
    fn, fallback = frontage_normals(doc)
    lines, cstats = centerlines(doc, grid, fn)
    zones = {z["id"]: dict(name=z["name"], xy=pts2(z["xy"]), c=z["c"], **({"area": z["area"]} if "area" in z else {})) for z in doc["zones"]}

    # features: only what v2 names. The gate is v2's "gate" point (GC V's surveyed "entrance" point is the same thing).
    points = {p["id"]: p for p in doc["points"]}
    features = {}
    gate = points.get("gate") or points.get("entrance")
    if gate:
        _, u, c = min((seg_dir(c["pts"], gate["at"]) + (c,) for c in lines), key=lambda t: t[0])
        cen = np.mean(np.array(doc["boundary"], float), axis=0)
        if np.dot(u, cen - np.array(gate["at"])) < 0:
            u = -u
        features["gate"] = dict(at=pts2([gate["at"]])[0], along=[round(float(u[0]), 3), round(float(u[1]), 3)], width=c["w"])
    oht = points.get("oht") or next((dict(at=z["c"]) for z in doc["zones"] if "OHT" in z["name"]), None)
    if oht:
        features["tank"] = dict(at=pts2([oht["at"]])[0])
    parks = [z for z in doc["zones"] if re.match(r"park\b", z["name"], re.I)]
    if parks:
        big = max(parks, key=lambda z: z.get("area") or abs(sum(z["xy"][i][0] * z["xy"][i - 1][1] - z["xy"][i - 1][0] * z["xy"][i][1] for i in range(len(z["xy"])))))
        features["park"] = dict(at=pts2([big["c"]])[0])
    if gate:
        features["revealFrom"] = features["gate"]["at"]
    else:
        lat0, lng0 = doc["origin"]["lat"], doc["origin"]["lng"]
        pin = [math.radians(doc["pin"]["lng"] - lng0) * 6378137.0 * math.cos(math.radians(lat0)), math.radians(doc["pin"]["lat"] - lat0) * 6378137.0]
        features["revealFrom"] = pts2([min(doc["boundary"], key=lambda q: math.dist(q, pin))])[0]

    tr = trees(doc, grid, [f["at"] for k, f in features.items() if k in ("tank", "park")])
    plots = []
    for p in doc["plots"]:
        rec = dict(n=p["n"], a=p["a"], xy=pts2(p["xy"]), c=pts2([p["c"]])[0], la=p["la"], f=p["f"], rw=p["rw"], fn=fn[p["n"]])
        for k in ("w", "d", "f2", "rw2", "corner", "through"):  # read by the plot card and the filters
            if k in p:
                rec[k] = p[k]
        plots.append(rec)
    mp = dict(
        version=1, project=doc["name"], origin=doc["origin"], pin=dict(lat=doc["pin"]["lat"], lng=doc["pin"]["lng"]),
        extent=doc["extent"], georef=dict(method=doc["georef"]["method"], rmsMetres=doc["georef"]["rmsMetres"]),
        landUse=land_use(doc), plots=plots,
        roads=[dict(outer=pts2(r["outer"]), holes=[pts2(h) for h in r["holes"]]) for r in doc["roads"]],
        road100=[dict(outer=pts2(a["xy"]), holes=[]) for a in doc["access"]],  # v2 access roads are already polygons
        greens=[dict(outer=pts2(g["outer"]), holes=[pts2(h) for h in g["holes"]]) for g in doc["greens"]],
        boundary=pts2(doc["boundary"]), wall=pts2(doc["boundary"]), zones=zones,
        centerlines=lines, trees=tr, features=features,
    )
    return mp, dict(fallback_fn=fallback, **cstats)


# ---------------------------------------------------------------- checks

def sample(line, every=1.0):
    out = []
    for i in range(len(line) - 1):
        a, b = np.array(line[i], float), np.array(line[i + 1], float)
        n = max(1, int(np.linalg.norm(b - a) / every))
        out += [(a + (b - a) * k / n).tolist() for k in range(n)]
    return out + [line[-1]]


def validate(mp, doc, path):
    """assert-based; returns the numbers it checked."""
    n2 = [p["n"] for p in doc["plots"]]
    assert len(mp["plots"]) == len(n2) and {p["n"] for p in mp["plots"]} == set(n2), "plot numbers differ from v2"
    assert all(isinstance(p["n"], str) for p in mp["plots"])
    a1, a2 = sum(p["a"] for p in mp["plots"]), sum(p["a"] for p in doc["plots"])
    assert abs(a1 - a2) / a2 < 0.005, f"area {a1} vs {a2}"
    outside = [p["n"] for p in mp["plots"] if not pip(p["c"], mp["boundary"])]
    assert not outside, f"plot centres outside the boundary: {outside}"
    rp = mp["roads"] + mp["road100"]
    S = [q for c in mp["centerlines"] for q in sample(c["pts"])]
    on = sum(in_polys(q, rp) for q in S) / max(len(S), 1)
    assert on >= 0.95, f"only {on:.1%} of centre-line samples on a road"
    assert len({c["id"] for c in mp["centerlines"]}) == len(mp["centerlines"])
    bad = [t for t in mp["trees"] if in_polys(t[:2], rp) or any(pip(t[:2], p["xy"]) for p in mp["plots"])]
    assert not bad, f"{len(bad)} trees on plots/roads, e.g. {bad[:3]}"
    assert all(0.8 <= t[2] <= 1.25 for t in mp["trees"])
    kb = os.path.getsize(path) / 1024
    assert kb < 300, f"{kb:.0f} KB"
    assert all(abs(math.hypot(*p["fn"]) - 1) < 0.01 for p in mp["plots"])
    return dict(plots=len(mp["plots"]), area=round(a1, 2), area_v2=round(a2, 2), landUse_plotted=mp["landUse"]["plotted"],
                centerlines=len(mp["centerlines"]), on_road=round(on, 4), trees=len(mp["trees"]), kb=round(kb, 1),
                fn_matches_f=sum(compass(*p["fn"]) == p["f"] for p in mp["plots"]), features=sorted(mp["features"]))


def compare_gc6(mp_derived):
    """Derived GC VI centre-lines against the curated ones: how close and whether the widths agree."""
    cur = json.load(open(os.path.join(OUT, "global-city-vi.json"), encoding="utf-8"))

    def near(q, lines):
        return min(((seg_dir(c["pts"], q)[0], c) for c in lines), key=lambda t: t[0])

    cs = [(q, c["w"]) for c in cur["centerlines"] for q in sample(c["pts"], 2.0)]
    ds = [(q, c["w"]) for c in mp_derived["centerlines"] for q in sample(c["pts"], 2.0)]
    d1 = [near(q, mp_derived["centerlines"]) for q, _ in cs]
    d2 = [near(q, cur["centerlines"]) for q, _ in ds]
    w_ok = sum(1 for (q, w), (d, c) in zip(cs, d1) if d < 3 and c["w"] == w)
    return dict(curated_lines=len(cur["centerlines"]), derived_lines=len(mp_derived["centerlines"]),
                curated_within_2m=round(sum(d < 2 for d, _ in d1) / len(d1), 3),
                derived_within_2m=round(sum(d < 2 for d, _ in d2) / len(d2), 3),
                median_offset_m=round(float(np.median([d for d, _ in d1])), 2),
                width_agree=round(w_ok / max(1, sum(d < 3 for d, _ in d1)), 3))


# ---------------------------------------------------------------- picture

def render(mp, path, ppm=2.0, ref=()):
    allp = [q for r in [mp["boundary"]] + [r["outer"] for r in mp["road100"]] for q in r]
    P = np.array(allp, float)
    o = P.min(axis=0) - 10
    W, H = (np.ceil((P.max(axis=0) + 10 - o) * ppm)).astype(int)
    img = np.full((H, W, 3), 245, np.uint8)
    tp = lambda ring: np.array([[(x - o[0]) * ppm, H - (y - o[1]) * ppm] for x, y in ring], np.int32)
    for r in mp["road100"]:
        cv2.fillPoly(img, [tp(r["outer"])], (110, 100, 95))
    for r in mp["roads"]:
        cv2.fillPoly(img, [tp(r["outer"])], (140, 135, 130))
        for h in r["holes"]:
            cv2.fillPoly(img, [tp(h)], (245, 245, 245))
    for g in mp["greens"]:
        cv2.fillPoly(img, [tp(g["outer"])], (150, 210, 150))
    for z in mp["zones"].values():
        cv2.polylines(img, [tp(z["xy"])], True, (200, 120, 200), 1)
    for p in mp["plots"]:
        cv2.fillPoly(img, [tp(p["xy"])], (235, 215, 190))
        cv2.polylines(img, [tp(p["xy"])], True, (150, 120, 90), 1)
        c = tp([p["c"]])[0]
        e = tp([[p["c"][0] + p["fn"][0] * 4, p["c"][1] + p["fn"][1] * 4]])[0]
        cv2.line(img, tuple(int(v) for v in c), tuple(int(v) for v in e), (60, 60, 200), 1)
    cv2.polylines(img, [tp(mp["boundary"])], True, (40, 40, 40), 2)
    colors = {30: (0, 170, 255), 33: (0, 220, 120), 40: (255, 80, 0), 100: (180, 0, 180)}
    for c in mp["centerlines"]:
        col = colors.get(c["w"], (0, 0, 255))
        cv2.polylines(img, [tp(c["pts"])], False, col, 2)
        for q in tp(c["pts"]):
            cv2.circle(img, tuple(int(v) for v in q), 2, (0, 0, 0), -1)
        m = tp([c["pts"][len(c["pts"]) // 2]])[0]
        cv2.putText(img, f'{c["id"]}:{c["w"]}', (int(m[0]) + 3, int(m[1]) - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 0, 0), 1, cv2.LINE_AA)
    for c in ref:  # curated centre-lines, for the GC VI comparison
        cv2.polylines(img, [tp(c["pts"])], False, (0, 0, 230), 1)
    for t in mp["trees"]:
        q = tp([t[:2]])[0]
        cv2.circle(img, tuple(int(v) for v in q), max(2, int(1.9 * t[2] * ppm)), (40, 120, 40), -1)
    for k, f in mp["features"].items():
        at = f["at"] if isinstance(f, dict) else f
        q = tuple(int(v) for v in tp([at])[0])
        cv2.drawMarker(img, q, (0, 0, 220), cv2.MARKER_STAR, 18, 2)
        cv2.putText(img, k, (q[0] + 8, q[1] + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 200), 1, cv2.LINE_AA)
        if k == "gate":
            e = tuple(int(v) for v in tp([[at[0] + f["along"][0] * 25, at[1] + f["along"][1] * 25]])[0])
            cv2.arrowedLine(img, q, e, (0, 0, 220), 2)
    cv2.imwrite(path, img)


def main():
    png = sys.argv[sys.argv.index("--png") + 1] if "--png" in sys.argv else None
    os.makedirs(OUT, exist_ok=True)
    for pid in EXPORT + ("global-city-vi",):
        doc = json.load(open(os.path.join(V2, f"{pid}.json"), encoding="utf-8"))
        mp, st = export(doc)
        if pid == "global-city-vi":  # sanity check only: the curated GC VI masterplan stays as it is
            print("global-city-vi (derived vs curated):", compare_gc6(mp), "| label overrides:", st["label_override"], "| plot votes:", st["plot_vote"])
        else:
            path = os.path.join(OUT, f"{pid}.json")
            with open(path, "w", encoding="utf-8") as f:
                json.dump(mp, f, separators=(",", ":"), ensure_ascii=False)
            print(f"{pid}:", validate(mp, doc, path), "| printed widths:", st["printed"], "| label overrides:", st["label_override"],
                  "| plot votes:", st["plot_vote"], "| fn fallback:", st["fallback_fn"][:10])
        if png:
            ref = json.load(open(os.path.join(OUT, "global-city-vi.json"), encoding="utf-8"))["centerlines"] if pid == "global-city-vi" else ()
            render(mp, os.path.join(png, f"{pid}.png"), ref=ref)


if __name__ == "__main__":
    main()
