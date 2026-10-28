"""
Builds the live-layout geometry (format v2) for the four projects in the live layouts app and the admin's Layout
view, from traceable sources in tools/layouts/source/<project-id>/:

  global-city-vi   masterplan.json  the GC VI demo plan (layout_demo, already georeferenced: 1.96 m rms)
  global-city-v    plots_px.json + site_px.json (digitised from the HMDA layout copy) + georef.json (control points)
  global-city-rrr  same, from the DTCP layout in the brochure
  western-county   same, from the HMDA layout on the client's flyer, plus phase2_px.json (Phase II, drawn as one zone)

Everything is emitted in local ENU metres (x east, y north) around `origin`; the apps convert to lat/lng.
Run:  python -P -E tools/layouts/build_layouts.py [extra output dir ...]
Writes admin/src/lib/layouts/<id>.json and index.json (and the same into any extra output dir given).
"""
import json, math, os, re, sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "source")
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
OUTS = [os.path.join(REPO, "admin", "src", "lib", "layouts"), *sys.argv[1:]]

R = 6378137.0
FT = 3.28084
WIND4 = ["East", "North", "West", "South"]
WIND8 = ["East", "North-East", "North", "North-West", "West", "South-West", "South", "South-East"]


def rnd(v, k=1):
    return round(float(v), k)


def pts(ring, k=1):
    return [[rnd(x, k), rnd(y, k)] for x, y in ring]


def area(ring):
    return 0.5 * sum(ring[i][0] * ring[(i + 1) % len(ring)][1] - ring[(i + 1) % len(ring)][0] * ring[i][1] for i in range(len(ring)))


def ccw(ring):
    return ring if area(ring) > 0 else ring[::-1]


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


def in_rings(pt, rings):
    return any(pip(pt, r["outer"]) and not any(pip(pt, h) for h in r.get("holes", [])) for r in rings)


def compass(nx, ny):
    ang = math.degrees(math.atan2(ny, nx)) % 360
    if min(ang % 90, 90 - ang % 90) <= 28:
        return WIND4[int(((ang + 45) % 360) // 90)]
    return WIND8[int(((ang + 22.5) % 360) // 45)]


def label_angle(r):
    """Text angle (radians, ENU) along the plot's longest edge, kept readable (never upside down)."""
    edges = sorted(((math.dist(r[i], r[(i + 1) % len(r)]), i) for i in range(len(r))), reverse=True)
    i0 = edges[0][1]
    ang = math.atan2(r[(i0 + 1) % len(r)][1] - r[i0][1], r[(i0 + 1) % len(r)][0] - r[i0][0])
    if ang > math.pi / 2:
        ang -= math.pi
    if ang <= -math.pi / 2:
        ang += math.pi
    return round(ang, 3)


def settle_labels(plots):
    """Squarish plots (sides within 15%) take the layout's dominant label direction instead of an arbitrary edge."""
    angles = sorted(p["la"] for p in plots)
    dom = angles[len(angles) // 2] if angles else 0
    for p in plots:
        r = p["xy"]
        e = sorted(math.dist(r[i], r[(i + 1) % len(r)]) for i in range(len(r)))
        if len(r) == 4 and e[-1] / max(e[0], 1e-6) < 1.15:
            p["la"] = dom
    return plots


def extent(*rings):
    xs = [p[0] for r in rings for p in r]
    ys = [p[1] for r in rings for p in r]
    return dict(minX=rnd(min(xs)), maxX=rnd(max(xs)), minY=rnd(min(ys)), maxY=rnd(max(ys)))


def outline(ring, size=100.0):
    """A small normalised path of the site outline for the project switcher (y down, fits a size×size box)."""
    xs, ys = [p[0] for p in ring], [p[1] for p in ring]
    w, h = max(xs) - min(xs), max(ys) - min(ys)
    k = size / max(w, h)
    simple = ring[:: max(1, len(ring) // 90)]
    d = "M" + "L".join(f"{(x - min(xs)) * k:.1f},{(max(ys) - y) * k:.1f}" for x, y in simple) + "Z"
    return dict(d=d, w=round(w * k, 1), h=round(h * k, 1))


def raster(rings, o, step, size):
    """0/1 mask of ENU rings on a grid with origin o (m) and cell `step` (m)."""
    import cv2
    m = np.zeros(size[::-1], np.uint8)
    cv2.fillPoly(m, [np.round((np.array(r, float) - o) / step).astype(np.int32) for r in rings], 1)
    return m


def box(ring, step):
    P = np.array(ring, float)
    o = P.min(axis=0) - step
    return o, np.ceil((P.max(axis=0) - o) / step).astype(int) + 2


def inside_share(ring, bnd, step=0.5):
    """Share of a ring's area that lies inside the boundary."""
    o, size = box(ring, step)
    a = raster([ring], o, step, size)
    return float((a & raster([bnd], o, step, size)).sum()) / max(int(a.sum()), 1)


def label_spot(ring, kids=(), step=0.25):
    """Where a zone's name goes: the centre of the largest circle inside it (less any zones drawn inside it, which
    carry their own names), and the free half-width and half-height (m) along the horizontal and vertical through that
    point, so the apps show the name only once it fits."""
    import cv2
    o, size = box(ring, step)
    m = raster([ring], o, step, size)
    if kids:
        m &= 1 - raster(kids, o, step, size)
    d = cv2.distanceTransform(m, cv2.DIST_L2, 5)
    # A strip's largest circles form a ridge: take its middle, not its first cell.
    ys, xs = np.nonzero(d >= d.max() - 1)
    i = int(np.argmin(np.hypot(xs - xs.mean(), ys - ys.mean())))
    y, x = ys[i], xs[i]

    def half(v, i):
        lo, hi = i, i
        while v[lo - 1]:
            lo -= 1
        while v[hi + 1]:
            hi += 1
        return round((min(i - lo, hi - i) + 0.5) * step, 1)

    return [rnd(o[0] + x * step), rnd(o[1] + y * step)], [half(m[y], x), half(m[:, x], y)]


def write(doc):
    for out in OUTS:
        os.makedirs(out, exist_ok=True)
        with open(os.path.join(out, f"{doc['id']}.json"), "w", encoding="utf-8") as f:
            json.dump(doc, f, separators=(",", ":"), ensure_ascii=False)
    print(f"{doc['id']}: {len(doc['plots'])} plots, {os.path.getsize(os.path.join(OUTS[0], doc['id'] + '.json')) / 1024:.0f} KB")


# ---------------------------------------------------------------- Global City VI (already georeferenced)

def global_city_vi():
    m = json.load(open(os.path.join(SRC, "global-city-vi", "masterplan.json"), encoding="utf-8"))
    plots = []
    for p in m["plots"]:
        rec = dict(n=str(p["n"]), a=p["a"], xy=pts(p["xy"]), c=[rnd(p["c"][0]), rnd(p["c"][1])], la=p.get("la", 0))
        for k in ("f", "rw", "f2", "rw2", "corner", "w", "d"):
            if k in p:
                rec[k] = p[k]
        plots.append(rec)
    # Road names from the centre-line fits; only the longer runs get a label so the map stays readable.
    labels = []
    for c in m["centerlines"]:
        q = c["pts"]
        if c["id"] == "R100":
            # The master plan road bends round the site's corner: label its longest run that lies on the road.
            runs = [(q[i], q[i + 1]) for i in range(len(q) - 1)
                    if any(pip(((q[i][0] + q[i + 1][0]) / 2, (q[i][1] + q[i + 1][1]) / 2), r["outer"]) for r in m["road100"])]
            if not runs:
                continue
            (x0, y0), (x1, y1) = max(runs, key=lambda r: math.dist(*r))
        else:
            (x0, y0), (x1, y1) = q[0], q[-1]
        if math.dist((x0, y0), (x1, y1)) < 70:
            continue
        ang = math.degrees(math.atan2(y1 - y0, x1 - x0))
        ang = ang - 180 if ang > 90 else ang + 180 if ang <= -90 else ang
        name = "100 ft road (master plan)" if c["id"] == "R100" else f"{c['w']} ft road"
        labels.append(dict(t=name, at=[rnd((x0 + x1) / 2), rnd((y0 + y1) / 2)], r=round(ang, 1)))
    zones = []
    for zid, z in m["zones"].items():
        rec = dict(id=zid, name=z["name"], xy=pts(z["xy"]))
        if z.get("area"):
            rec["area"] = z["area"]
        zones.append(rec)
    f = m["features"]
    lu = m["landUse"]
    doc = dict(
        v=2, id="global-city-vi", name="Global City VI",
        origin=m["origin"], pin=dict(**m["pin"], source="QR code printed on the brochure"),
        source=dict(title="HMDA layout copy (brochure cum layout)", reference="2046/HMDA/SWFL/2026"),
        georef=dict(method="Affine fit on 32 road intersections and road ends against Google satellite imagery", rmsMetres=m["georef"]["rmsMetres"]),
        extent=extent(m["boundary"], *[p["xy"] for p in m["plots"]]),
        landUse=[dict(label="Plotted", sqyd=lu["plotted"]), dict(label="Roads", sqyd=lu["roads"]), dict(label="Parks", sqyd=lu["park"]),
                 dict(label="Social infrastructure", sqyd=lu["social"]), dict(label="Utility", sqyd=lu["utility"])],
        landTotal=lu["net"], landArea=lu["totalArea"], plotCount=lu["totalPlots"],
        plots=settle_labels(plots),
        boundary=pts(m["boundary"]),
        roads=[dict(outer=pts(r["outer"]), holes=[pts(h) for h in r["holes"]]) for r in m["roads"]],
        roadLabels=labels,
        access=[dict(name="100 ft road (master plan)", w=100, xy=pts(r["outer"])) for r in m["road100"]],
        greens=[dict(outer=pts(g["outer"]), holes=[pts(h) for h in g["holes"]]) for g in m["greens"]],
        zones=zones,
        points=[dict(id="gate", name="Main entrance", at=[rnd(v) for v in f["gate"]["at"]]),
                dict(id="clubhouse", name="Clubhouse", at=[rnd(v) for v in f["clubhouse"]["at"]]),
                dict(id="oht", name="Overhead water tank", at=[rnd(v) for v in f["tank"]["at"]])],
    )
    doc["outline"] = outline(doc["boundary"])
    return doc


# ---------------------------------------------------------------- digitised drawings (GC V, GC RRR, Western County)

def merc_world(lat, lng, z):
    n = 256 * 2 ** z
    s = math.sin(math.radians(lat))
    return n * (lng + 180) / 360, n * (0.5 - math.log((1 + s) / (1 - s)) / (4 * math.pi))


def merc_latlng(wx, wy, z):
    n = 256 * 2 ** z
    return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * wy / n)))), wx / n * 360 - 180


def fit_affine(src, dst):
    """Least-squares affine src -> dst (both Nx2). Returns 3x2 matrix and per-point residuals (dst units)."""
    A = np.hstack([np.asarray(src, float), np.ones((len(src), 1))])
    M, *_ = np.linalg.lstsq(A, np.asarray(dst, float), rcond=None)
    res = np.linalg.norm(A @ M - np.asarray(dst, float), axis=1)
    return M, res


def digitised(pid, meta):
    folder = os.path.join(SRC, pid)
    plots_px = json.load(open(os.path.join(folder, "plots_px.json"), encoding="utf-8"))
    site = json.load(open(os.path.join(folder, "site_px.json"), encoding="utf-8"))
    geo = json.load(open(os.path.join(folder, "georef.json"), encoding="utf-8"))

    cap = geo["capture"]
    z = cap["z"]
    cwx, cwy = merc_world(cap["lat"], cap["lng"], z)
    mpp = 156543.03392 * math.cos(math.radians(cap["lat"])) / 2 ** z
    warp = None
    if "tps" in geo:  # georef_tps.py: thin-plate spline through matched road junctions (drawings far from scale)
        from scipy.interpolate import RBFInterpolator
        t = geo["tps"]
        warp = RBFInterpolator(np.array(t["src"]), np.array(t["dst"]), kernel="thin_plate_spline", smoothing=np.asarray(t["smoothing"], float))
        pairs = np.array(t["src"])
        rms = float(geo["rmsMetres"])
    elif "affine" in geo:  # fitted by georef_points.py / georef_chamfer.py; the residual is measured there
        M = np.array(geo["affine"], float)
        pairs = np.array(geo.get("pairs", []), float).reshape(-1, 4)
        rms = float(geo["rmsMetres"])
    else:  # hand-picked control points [bx, by, sx, sy]: brochure px -> capture px
        pairs = np.array(geo["pairs"], float)
        M, res = fit_affine(pairs[:, :2], pairs[:, 2:])
        rms = float(np.sqrt(np.mean(res ** 2)) * mpp)
    method = geo.get("method") or f"Affine fit on {len(pairs)} road intersections and corners against Google satellite imagery"

    def to_ll(p):
        sx, sy = warp(np.array([[p[0], p[1]]], float))[0] if warp is not None else np.array([p[0], p[1], 1.0]) @ M
        return merc_latlng(cwx + sx - cap["w"] / 2, cwy + sy - cap["h"] / 2, z)

    cents = [to_ll(np.mean(np.array(p["poly"], float), axis=0)) for p in plots_px.values()]
    origin = dict(lat=round(float(np.mean([c[0] for c in cents])), 7), lng=round(float(np.mean([c[1] for c in cents])), 7))
    cos0 = math.cos(math.radians(origin["lat"]))

    def xy(p):
        lat, lng = to_ll(p)
        return [math.radians(lng - origin["lng"]) * R * cos0, math.radians(lat - origin["lat"]) * R]

    def ring(poly):
        return ccw([xy(p) for p in poly])

    roads = [dict(outer=ring(r["outer"]), holes=[ring(h) for h in r.get("holes", [])]) for r in site["roads"]]
    access = [dict(name=re.sub(r"(\d+)' wide", r"\1 ft", a["name"]), w=a.get("widthFt"), st=a.get("status"), xy=ring(a["poly"]))
              for a in site.get("accessRoads", [])]
    widths = sorted({l["widthFt"] for l in site.get("roadLabels", []) if l.get("widthFt")} | {a["w"] for a in access if a["w"]})

    # Road label axes in ENU: a point and a unit direction (image angle is clockwise from +x with y down).
    labels = []
    for l in site.get("roadLabels", []):
        a = math.radians(l.get("angleDeg", 0))
        p0, p1 = xy(l["at"]), xy([l["at"][0] + 40 * math.cos(a), l["at"][1] + 40 * math.sin(a)])
        u = np.array(p1) - np.array(p0)
        u /= max(np.linalg.norm(u), 1e-9)
        labels.append(dict(t=l["text"], w=l.get("widthFt"), at=np.array(p0), u=u, phase=l.get("phase")))

    def road_at(probe, edge_dir):
        """Width (ft) of the road a plot edge faces: an access road polygon names its own; otherwise the road label
        running parallel to the edge whose axis passes nearest the probe; failing that, measure and snap."""
        for a in access:
            if a["w"] and pip(probe, a["xy"]):
                return a["w"], True
        best = None
        for l in labels:
            if not l["w"] or abs(float(np.dot(l["u"], edge_dir))) < 0.85:
                continue
            q = np.array(probe) - l["at"]
            d = abs(float(l["u"][0] * q[1] - l["u"][1] * q[0]))
            if d < 25 and (best is None or d < best[0]):
                best = (d, l["w"])
        if best:
            return best[1], False
        return None, False

    # Side lengths printed in each cell, when the digitising pass read them: they beat any measurement off the drawing.
    sides_path = os.path.join(folder, "sides.json")
    printed = json.load(open(sides_path, encoding="utf-8"))["sides"] if os.path.exists(sides_path) else None

    def feet(s):
        # 30'-7" is feet and inches. Western County's Phase I writes decimal feet as 50'.3" (= 50.3 ft): only that
        # reading gives its printed areas (36'.4" x 60' = 242.67 -> 243), and no .10 or .11 occurs. Its plot 154
        # prints one side as two segments (21'.2"+25'.5").
        if "+" in s:
            return sum(feet(x) for x in s.split("+"))
        f, _, i = s.partition("'")
        dec = i.startswith(".")
        i = i.strip('-."')
        return float(f) + (float("0." + i) if dec else float(i) / 12 if i else 0)

    def printed_dims(n, area_sqyd, r, front_ft):
        """(front, depth) in ft from the sides printed in the cell, or None.

        Both sides printed: they must give the printed area (within 1%). One side printed (interior cells print only
        the frontage; the depth is printed once per column): the other is the printed area over it, accepted only for a
        drawn rectangle whose sides agree with both lengths (within 7%), rounded to the quarter foot it was printed in.
        The side nearer the measured road frontage is the front."""
        s = dict((t[0], feet(t[1:])) for t in printed.get(n, "").split())
        vert = {s[k] for k in "LR" if k in s}
        horiz = {s[k] for k in "TB" if k in s}
        if len(vert) > 1 or len(horiz) > 1 or not (vert or horiz):
            return None
        if vert and horiz:
            a, b = vert.pop(), horiz.pop()
            if abs(a * b / 9 - area_sqyd) / area_sqyd > 0.01:
                return None
        else:
            if len(r) != 4:
                return None
            e = [math.dist(r[i], r[(i + 1) % 4]) * FT for i in range(4)]
            for i in range(4):  # near-right corners only
                u = np.subtract(r[(i + 1) % 4], r[i])
                v = np.subtract(r[(i - 1) % 4], r[i])
                if abs(float(np.dot(u, v)) / (np.linalg.norm(u) * np.linalg.norm(v))) > 0.1:
                    return None
            a = (vert or horiz).pop()
            pairs = [(e[0] + e[2]) / 2, (e[1] + e[3]) / 2]
            k = min(range(2), key=lambda i: abs(pairs[i] - a))
            m = pairs[1 - k]
            b = round(area_sqyd * 9 / a * 4) / 4
            if abs(pairs[k] - a) / a > 0.07 or abs(b - m) / m > 0.07 or abs(a * b / 9 - area_sqyd) / area_sqyd > 0.006:
                return None
        return (a, b) if abs(front_ft - a) <= abs(front_ft - b) else (b, a)

    plots = []
    for n in sorted(plots_px, key=lambda k: int(k)):
        p = plots_px[n]
        r = ring(p["poly"])
        c = np.mean(np.array(r), axis=0)
        fronts = []
        for i in range(len(r)):
            a, b = np.array(r[i]), np.array(r[(i + 1) % len(r)])
            L = float(np.linalg.norm(b - a))
            if L < 4.0:
                continue
            e = (b - a) / L
            nrm = np.array([e[1], -e[0]])
            mid = (a + b) / 2
            if np.dot(nrm, mid - c) < 0:
                nrm = -nrm
            for reach in (2.5, 4.5):
                probe = (mid + nrm * reach).tolist()
                if in_rings(probe, roads) or any(pip(probe, x["xy"]) for x in access):
                    w, ext = road_at(probe, e)
                    if w:
                        fronts.append(dict(i=i, L=L, n=nrm, w=w, ext=ext))
                    break
        rec = dict(n=str(int(n)), a=p["area"], xy=pts(r), c=[rnd(c[0]), rnd(c[1])], la=label_angle(r))
        if fronts:
            # A plot faces its internal road; an outside road is a second frontage. Corner: the shorter road side leads.
            fronts.sort(key=lambda f: (f["ext"], f["L"]))
            distinct = []
            for f in fronts:
                if all(np.dot(f["n"], g["n"]) < 0.5 for g in distinct):
                    distinct.append(f)
            main = distinct[0]
            rec["f"], rec["rw"] = compass(*main["n"]), main["w"]
            if len(distinct) > 1:
                rec["corner" if np.dot(distinct[0]["n"], distinct[1]["n"]) > -0.5 else "through"] = True
                rec["f2"], rec["rw2"] = compass(*distinct[1]["n"]), distinct[1]["w"]
            if len(r) == 4 and printed is None:
                # No printed sides: a size is published only for a right-angled plot whose drawn sides match one of
                # the layout modules (whole feet, depth in 5 ft steps) that gives the printed area (printed areas are
                # whole sq yd, so within half a sq yd). Trapezoids and odd sizes get none rather than a guess.
                right = all(abs(float(np.dot(np.subtract(r[(k + 1) % 4], r[k]), np.subtract(r[(k - 1) % 4], r[k])))
                                / (np.linalg.norm(np.subtract(r[(k + 1) % 4], r[k])) * np.linalg.norm(np.subtract(r[(k - 1) % 4], r[k])))) < 0.1
                            for k in range(4))
                front = main["L"] * FT
                sides = [float(np.linalg.norm(np.array(r[(k + 1) % 4]) - np.array(r[k]))) * FT for k in range(4) if k not in (main["i"], (main["i"] + 2) % 4)]
                depth = float(np.mean(sides))
                best = None
                for w in (30, 33, 35, 40, 45, 50, 55, 60):  # frontages the layouts use
                    for d in range(30, 101, 5):
                        if abs(w * d / 9 - p["area"]) > 0.5:
                            continue
                        cost = abs(w - front) / front + abs(d - depth) / depth
                        if abs(w - front) / front < 0.08 and abs(d - depth) / depth < 0.08 and (best is None or cost < best[0]):
                            best = (cost, w, d)
                if right and best:
                    rec["w"], rec["d"] = float(best[1]), float(best[2])
        if printed is not None:
            rec.pop("w", None)
            rec.pop("d", None)
            dims = printed_dims(rec["n"], p["area"], r, fronts[0]["L"] * FT) if fronts else None
            if dims:
                rec["w"], rec["d"] = dims
        plots.append(rec)

    boundary = ring(site["boundary"])
    # Printed areas are square yards, or square metres on some drawings (Western County's parks): kept in sq yd.
    sqyd = lambda rec: rec.get("areaSqYd") or (round(rec["areaSqM"] * 1.19599, 2) if rec.get("areaSqM") else None)
    zones = []
    for zrec in site.get("zones", []):
        out = dict(id=zrec["id"], name=zrec["name"], xy=pts(ring(zrec["poly"])))
        if sqyd(zrec):
            out["area"] = sqyd(zrec)
        if zrec.get("partOf"):  # drawn inside another zone (GC V's transformer in its utility plot)
            out["partOf"] = zrec["partOf"]
        zones.append(out)
    greens = []
    for g in site.get("greens", []):
        # Decorative tree artwork outside the site boundary is not land use: leave it out. By area, not by corners:
        # a park's corners can sit on the boundary line (RRR's park), and a tree strip hugging the boundary from
        # outside can have its corner mean inside the site.
        outer = ring(g["outer"])
        if inside_share(outer, boundary) < 0.5:
            continue
        greens.append(dict(outer=pts(outer), holes=[pts(ring(h)) for h in g.get("holes", [])]))
        if g.get("label") and sqyd(g):
            num = re.search(r"PARK\s*-\s*(\d+)", g["label"], re.I)
            zones.append(dict(id=f"park-{len(zones)}", name=f"Park {num.group(1)}" if num else "Park", xy=pts(outer), area=sqyd(g)))
    # A later phase drawn on the same plan (Western County's 15 Phase II plots) is one outlined zone, not plots:
    # the approved plots are the inventory.
    phase2_path = os.path.join(folder, "phase2_px.json")
    if os.path.exists(phase2_path):
        import cv2
        p2 = json.load(open(phase2_path, encoding="utf-8"))
        allp = np.array([q for v in p2.values() for q in v["poly"]], float)
        o = allp.min(axis=0) - 60  # margin wider than the closing's reach, or the outline bulges to the canvas edge
        cells = np.zeros(tuple((allp.max(axis=0) - o + 60).astype(int)[::-1]), np.uint8)
        for v in p2.values():
            cv2.fillPoly(cells, [np.round(np.array(v["poly"], float) - o).astype(np.int32)], 1)
        # Across the cell borders and the 30 ft roads between the blocks (~85 px), so the phase is one outline.
        m = cv2.morphologyEx(cells, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (101, 101)))
        for c in cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
            if cv2.contourArea(c) >= 2000:
                zr = ring((cv2.approxPolyDP(c, 3, True)[:, 0] + o).tolist())
                zones.append(dict(id=f"phase-2-{len(zones)}", name=f"Phase II · {len(p2)} villa plots", xy=pts(zr)))

    road_labels = []
    for l in labels:
        if l["phase"] == "II":  # a later phase is one named area: its unbuilt roads are not labelled
            continue
        ang = math.degrees(math.atan2(l["u"][1], l["u"][0]))
        ang = ang - 180 if ang > 90 else ang + 180 if ang <= -90 else ang
        road_labels.append(dict(t=f"{l['w']} ft road" if l["w"] else l["t"].capitalize(), at=[rnd(l["at"][0]), rnd(l["at"][1])], r=round(ang, 1)))

    doc = dict(
        v=2, id=pid, name=meta["name"], origin=origin, pin=meta["pin"], source=meta["source"],
        georef=dict(method=method, rmsMetres=round(rms, 2)),
        extent=extent(boundary, *[p["xy"] for p in plots]),
        landUse=meta["landUse"], landTotal=meta["landTotal"], landArea=meta["landArea"], plotCount=meta["plotCount"],
        plots=settle_labels(plots),
        boundary=pts(boundary),
        roads=[dict(outer=pts(r["outer"]), holes=[pts(h) for h in r["holes"]]) for r in roads],
        roadLabels=road_labels,
        access=[dict({k: v for k, v in a.items() if v is not None and k != "xy"}, xy=pts(a["xy"])) for a in access],
        greens=greens, zones=zones,
        points=[dict(id=pt["id"], name=pt["name"], at=[rnd(v) for v in xy(pt["at"])]) for pt in site.get("points", [])],
    )
    doc["outline"] = outline(doc["boundary"])
    print(f"{pid}: georef {rms:.2f} m ({method}); widths {widths}")
    nf = [p["n"] for p in plots if "f" not in p]
    print(f"  area sum {sum(p['a'] for p in plots):.2f} vs printed {meta['landUse'][0]['sqyd']}; no frontage: {nf[:20]}{'…' if len(nf) > 20 else ''}; with dims: {sum('w' in p for p in plots)}")
    return doc


if __name__ == "__main__":
    docs = [global_city_vi()]
    for pid in ("global-city-v", "global-city-rrr", "western-county"):
        folder = os.path.join(SRC, pid)
        if all(os.path.exists(os.path.join(folder, f)) for f in ("georef.json", "plots_px.json", "site_px.json")):
            docs.append(digitised(pid, json.load(open(os.path.join(folder, "meta.json"), encoding="utf-8"))))
        else:
            print(f"{pid}: skipped (digitised data or georef missing)")
    for d in docs:
        for z in d["zones"]:
            z["c"], z["room"] = label_spot(z["xy"], [k["xy"] for k in d["zones"] if k.get("partOf") == z["id"]])
        write(d)
    # What the admin says about each drawing without loading the geometry (its Layout view and Live layouts screen).
    index = {d["id"]: dict(plots=len(d["plots"]), plotCount=d["plotCount"], fit=(d["georef"] or {}).get("rmsMetres"),
                           source={k: v for k, v in d["source"].items() if k in ("title", "reference", "pending")},
                           landArea=d["landArea"])
             for d in docs}
    for out in OUTS:
        with open(os.path.join(out, "index.json"), "w", encoding="utf-8") as f:
            json.dump(index, f, indent=1)
