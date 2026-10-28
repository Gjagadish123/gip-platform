"""
Fits a digitised layout drawing that is far from scale (Global City V: blocks stretched by different amounts) to a
Google satellite capture with a thin-plate spline through matched road junctions.

1. Roads on the imagery: Sato ridge filter on lightness (carriageways 9-14 m wide) -> skeleton -> junctions.
   Roads on the drawing: site_px.json road polygons -> skeleton -> junctions.
2. Start: brute-force search of rotation and the two axis scales, with one known correspondence (an anchor such as
   the overhead tank) fixing the shift; score = mean ridge strength under the drawing's road centre-lines.
3. Refine: match drawing junctions to imagery junctions (mutual nearest, shrinking radius), refit a robust affine,
   then a thin-plate spline through the matches (with smoothing). Residuals are leave-one-out, in metres.

Run:  python -P -E tools/layouts/georef_tps.py <project-id> <capture.png> <lat> <lng> <zoom> <bx,by:sx,sy> <deg_lo,deg_hi> [extra.json]
extra.json (optional): hand-picked [[bx, by, sx, sy], ...] added to the matches where junctions are sparse.
Writes tools/layouts/source/<project-id>/georef.json ({"tps": ...}) and a QA overlay beside the capture.
"""
import json, math, os, sys

import cv2
import numpy as np
from scipy.interpolate import RBFInterpolator
from scipy.spatial import cKDTree
from skimage.filters import sato
from skimage.morphology import skeletonize

HERE = os.path.dirname(os.path.abspath(__file__))
pid, cap_path, lat, lng, z = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), int(sys.argv[5])
(ax, ay), (asx, asy) = [tuple(map(float, s.split(","))) for s in sys.argv[6].split(":")]
deg_lo, deg_hi = map(float, sys.argv[7].split(","))
src = os.path.join(HERE, "source", pid)
site = json.load(open(os.path.join(src, "site_px.json"), encoding="utf-8"))
sat = cv2.imread(cap_path)
H, W = sat.shape[:2]
mpp = 156543.03392 * math.cos(math.radians(lat)) / 2 ** z


def junctions(skel, merge):
    sk = skel.astype(np.uint8)
    nb = cv2.filter2D(sk, -1, np.ones((3, 3), np.float32)) - sk
    ys, xs = np.nonzero((sk == 1) & (nb >= 3))
    pts = np.stack([xs, ys], 1).astype(float)
    out = []
    used = np.zeros(len(pts), bool)
    tree = cKDTree(pts) if len(pts) else None
    for i in range(len(pts)):
        if used[i]:
            continue
        idx = tree.query_ball_point(pts[i], merge)
        used[idx] = True
        out.append(pts[idx].mean(axis=0))
    return np.array(out)


# --- imagery roads
lab = cv2.cvtColor(sat, cv2.COLOR_BGR2LAB).astype(np.float32)
Lh = cv2.resize(lab[:, :, 0], (W // 2, H // 2), interpolation=cv2.INTER_AREA) / 255.0
ridge = sato(Lh, sigmas=[4, 6, 8], black_ridges=False)
ridge = (ridge / np.percentile(ridge, 99.5)).clip(0, 1).astype(np.float32)
road_h = cv2.morphologyEx((ridge > 0.35).astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
sat_j = junctions(skeletonize(road_h > 0), 6) * 2  # full-res px
ridge_f = cv2.resize(cv2.GaussianBlur(ridge, (0, 0), 2), (W, H))

# --- drawing roads
q = 4
xs = [p[0] for r in site["roads"] for p in r["outer"]]
ys = [p[1] for r in site["roads"] for p in r["outer"]]
m = np.zeros(((int(max(ys)) + 40) // q, (int(max(xs)) + 40) // q), np.uint8)
for r in site["roads"]:
    cv2.fillPoly(m, [(np.array(r["outer"]) / q).astype(np.int32)], 1)
    for h in r.get("holes", []):
        cv2.fillPoly(m, [(np.array(h) / q).astype(np.int32)], 0)
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
skel_b = skeletonize(m > 0)
by_, bx_ = np.nonzero(skel_b)
B = np.stack([bx_, by_], 1).astype(float) * q
B = B[:: max(1, len(B) // 5000)]
bro_j = junctions(skel_b, 10) * q
print(f"junctions: drawing {len(bro_j)}, imagery {len(sat_j)}")

# --- 2. brute-force start (anchor fixes the shift)
def affine(t, kx, ky):
    c, s = math.cos(t), math.sin(t)
    M = np.array([[c * kx, s * kx], [-s * ky, c * ky], [0.0, 0.0]])
    M[2] = np.array([asx, asy]) - np.array([ax, ay]) @ M[:2]
    return M


def score(M):
    P = np.hstack([B, np.ones((len(B), 1))]) @ M
    ok = (P[:, 0] >= 0) & (P[:, 0] < W - 1) & (P[:, 1] >= 0) & (P[:, 1] < H - 1)
    return float(ridge_f[P[ok, 1].astype(int), P[ok, 0].astype(int)].sum() / len(B))


best = (-1, None)
for deg in np.arange(deg_lo, deg_hi + 0.01, 0.75):
    for kx in np.arange(0.30, 0.70, 0.015):
        for ky in np.arange(0.30, 0.70, 0.015):
            s = score(affine(math.radians(deg), kx, ky))
            if s > best[0]:
                best = (s, (deg, kx, ky))
deg, kx, ky = best[1]
M = affine(math.radians(deg), kx, ky)
print(f"start: {deg:.2f} deg, scale {kx:.3f}/{ky:.3f}, score {best[0]:.3f}")

# --- 3. junction matching with a robust affine, shrinking radius
def apply(M, P):
    return np.hstack([P, np.ones((len(P), 1))]) @ M

tree_s = cKDTree(sat_j)
pairs = None
for radius in (60, 40, 28, 20, 14):
    Pj = apply(M, bro_j)
    d, i = tree_s.query(Pj, distance_upper_bound=radius)
    ok = np.isfinite(d)
    # mutual nearest
    back = cKDTree(Pj).query(sat_j[i[ok]])[1]
    mutual = back == np.nonzero(ok)[0]
    src_pts = bro_j[ok][mutual]
    dst_pts = sat_j[i[ok]][mutual]
    if len(src_pts) < 6:
        break
    # robust affine: iteratively drop the worst 10% while residuals exceed 2x median
    sel = np.ones(len(src_pts), bool)
    for _ in range(5):
        A = np.hstack([src_pts[sel], np.ones((sel.sum(), 1))])
        Mn, *_ = np.linalg.lstsq(A, dst_pts[sel], rcond=None)
        res = np.linalg.norm(apply(Mn, src_pts) - dst_pts, axis=1)
        sel = res <= max(2.5 * np.median(res[sel]), 4.0)
    M = Mn
    pairs = (src_pts[sel], dst_pts[sel])
    print(f"radius {radius}: {len(src_pts)} matches, {sel.sum()} kept, affine rms {np.sqrt(np.mean(res[sel] ** 2)) * mpp:.2f} m")

# The start anchor only seeds the search; measured road anchors (extra.json), when given, pin the spline instead.
fixed_src = np.array([[ax, ay]])
fixed_dst = np.array([[asx, asy]])
if len(sys.argv) > 8:
    extra = np.array(json.load(open(sys.argv[8], encoding="utf-8")), float).reshape(-1, 4)
    fixed_src, fixed_dst = extra[:, :2], extra[:, 2:]
    print(f"{len(extra)} measured anchors")

# --- 3b. re-match every drawing junction through the current spline, so blocks the affine left far off come in
# Smoothing is in kernel units (r^2 log r, r in px ~ 1e4..1e8): 1e6 lets the spline pass a metre or two off a noisy
# automatic match instead of bending the blocks around it; measured anchors (appended last) are pinned.
SMOOTH, PIN = 1e6, 2.0


def spline(S_, D_, n_fixed):
    return RBFInterpolator(S_, D_, kernel="thin_plate_spline",
                           smoothing=np.r_[np.full(len(S_) - n_fixed, SMOOTH), np.full(n_fixed, PIN)])


src_pts = np.vstack([pairs[0], fixed_src])
dst_pts = np.vstack([pairs[1], fixed_dst])
for radius in (40, 30, 22, 16, 12):
    f = spline(src_pts, dst_pts, len(fixed_src))
    Pj = f(bro_j)
    d, i = tree_s.query(Pj, distance_upper_bound=radius)
    ok = np.isfinite(d)
    if ok.sum() < 6:
        break
    back = cKDTree(Pj).query(sat_j[i[ok]])[1]
    mutual = back == np.nonzero(ok)[0]
    s_, d_ = bro_j[ok][mutual], sat_j[i[ok]][mutual]
    # Hand-measured anchors win: drop automatic matches near them (a skeleton junction can sit in a median).
    if len(sys.argv) > 8:
        near = cKDTree(fixed_src).query(s_)[0] < 200
        s_, d_ = s_[~near], d_[~near]
        if len(s_) < 3:
            break
    res = np.linalg.norm(f(s_) - d_, axis=1)
    keep = res <= max(2.5 * np.median(res), 4.0)
    src_pts = np.vstack([s_[keep], fixed_src])
    dst_pts = np.vstack([d_[keep], fixed_dst])
    print(f"spline radius {radius}: {len(s_)} matches, {keep.sum()} kept, median {np.median(res[keep]) * mpp:.2f} m")

# --- 3c. The plots are drawn to one scale (drawn area per printed sq yd is uniform), so a spline that squeezes or
# stretches some of them is following a bad automatic match (the entrance plaza's skeleton junctions did this): drop
# the automatic match whose removal helps the worst plot most until every plot keeps 85-115 % of the median scale.
# Measured anchors (appended last) are never dropped.
plots_path = os.path.join(src, "plots_px.json")
if os.path.exists(plots_path):
    drawn = list(json.load(open(plots_path, encoding="utf-8")).values())
    polys = [np.array(p["poly"], float) for p in drawn]
    printed = np.array([p["area"] for p in drawn], float)
    shoelace = lambda P: abs(np.dot(P[:, 0], np.roll(P[:, 1], -1)) - np.dot(np.roll(P[:, 0], -1), P[:, 1])) / 2

    def worst(S_, D_):
        f_ = spline(S_, D_, len(fixed_src))
        r = np.array([shoelace(f_(P)) for P in polys]) / printed
        r /= np.median(r)
        return min(r.min(), 1 / r.max())

    n_auto = len(src_pts) - len(fixed_src)
    while n_auto and len(src_pts) > 3 and (w := worst(src_pts, dst_pts)) < 0.85:  # a 2-D spline needs 3 points
        k = max(range(n_auto), key=lambda k: worst(np.delete(src_pts, k, 0), np.delete(dst_pts, k, 0)))
        if worst(np.delete(src_pts, k, 0), np.delete(dst_pts, k, 0)) <= w:
            print(f"worst plot at {w:.2f} of the median area scale and no automatic match is to blame: check the measured anchors")
            break
        print(f"worst plot at {w:.2f} of the median area scale: dropping automatic match at drawing {src_pts[k].round().tolist()}")
        src_pts, dst_pts, n_auto = np.delete(src_pts, k, 0), np.delete(dst_pts, k, 0), n_auto - 1
    print(f"plot area scale: worst plot {worst(src_pts, dst_pts):.2f} of the median")

# --- thin-plate spline with smoothing; leave-one-out residuals
loo = []
n_fixed = len(fixed_src)
for k in range(len(src_pts)):
    keep = np.arange(len(src_pts)) != k
    f = spline(src_pts[keep], dst_pts[keep], n_fixed - (k >= len(src_pts) - n_fixed))
    loo.append(np.linalg.norm(f(src_pts[k:k + 1])[0] - dst_pts[k]))
loo = np.array(loo) * mpp
print(f"TPS on {len(src_pts)} points: leave-one-out median {np.median(loo):.2f} m, rms {np.sqrt(np.mean(loo ** 2)):.2f} m, max {loo.max():.2f} m")

# Fit quality as the page reports it: how far the drawing's road centre-lines land from the built roads (the
# leave-one-out figure above is pessimistic: dropping an end anchor makes the spline extrapolate).
f = spline(src_pts, dst_pts, n_fixed)
print(f"measured anchors: spline passes within {np.linalg.norm(f(fixed_src) - fixed_dst, axis=1).max() * mpp:.2f} m of each")
road_dist = cv2.resize(cv2.distanceTransform((road_h == 0).astype(np.uint8), cv2.DIST_L2, 5), (W, H)) * 2
Pc = f(B)
okc = (Pc[:, 0] >= 0) & (Pc[:, 0] < W) & (Pc[:, 1] >= 0) & (Pc[:, 1] < H)
dc = road_dist[Pc[okc, 1].astype(int), Pc[okc, 0].astype(int)] * mpp
p90 = float(np.percentile(dc, 90))
print(f"road centre-lines to built roads: median {np.median(dc):.2f} m, 75% {np.percentile(dc, 75):.2f} m, 90% {p90:.2f} m")

json.dump(dict(capture=dict(lat=lat, lng=lng, z=z, w=W, h=H),
               tps=dict(src=src_pts.round(1).tolist(), dst=dst_pts.round(1).tolist(),
                        smoothing=np.r_[np.full(len(src_pts) - n_fixed, SMOOTH), np.full(n_fixed, PIN)].tolist()),
               rmsMetres=round(p90, 2), looRmsMetres=round(float(np.sqrt(np.mean(loo ** 2))), 2),
               method=f"Thin-plate spline through {n_fixed} road points measured on Google satellite imagery and {len(src_pts) - n_fixed} matched road junctions; 90% of the drawing's road centre-lines lie within {p90:.1f} m of the built roads"),
          open(os.path.join(src, "georef.json"), "w"), indent=1)

f = spline(src_pts, dst_pts, n_fixed)
qa = sat.copy()
qa[cv2.resize(road_h, (W, H)) > 0] = (0.65 * qa[cv2.resize(road_h, (W, H)) > 0] + 0.35 * np.array([255, 255, 0])).astype(np.uint8)
tr = lambda poly: f(np.array(poly, float)).astype(np.int32)
for r in site["roads"]:
    cv2.polylines(qa, [tr(r["outer"])], True, (0, 0, 255), 2)
cv2.polylines(qa, [tr(site["boundary"])], True, (0, 255, 255), 2)
if os.path.exists(os.path.join(src, "plots_px.json")):
    for p in json.load(open(os.path.join(src, "plots_px.json"), encoding="utf-8")).values():
        cv2.polylines(qa, [tr(p["poly"])], True, (255, 0, 255), 1)
for s_, d_ in zip(src_pts, dst_pts):
    cv2.circle(qa, tuple(d_.astype(int)), 6, (0, 255, 0), 2)
cv2.imwrite(os.path.splitext(cap_path)[0] + f"-{pid}-tps.png", qa)
print("wrote", os.path.join(src, "georef.json"))
