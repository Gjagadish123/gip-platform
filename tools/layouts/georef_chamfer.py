"""
Fits a digitised layout drawing to a Google satellite capture by chamfer matching: the drawing's road centre-lines
(skeleton of site_px.json roads) are pulled onto the built roads in the imagery (bright, unsaturated carriageway),
with the same model as georef_points.py: rotation + per-axis scale + shift, no shear. Starts from a rough guess
(one known correspondence, an angle and a scale) and refines with Powell's method from several starts.

Run:  python -P -E tools/layouts/georef_chamfer.py <project-id> <capture.png> <lat> <lng> <zoom> <bx,by:sx,sy> <deg> <scale>
Writes tools/layouts/source/<project-id>/georef.json (affine + residual) and a QA overlay beside the capture.
"""
import json, math, os, sys

import cv2
import numpy as np
from scipy.optimize import minimize
from skimage.morphology import skeletonize

HERE = os.path.dirname(os.path.abspath(__file__))
pid, cap_path, lat, lng, z = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), int(sys.argv[5])
(bx0, by0), (sx0, sy0) = [tuple(map(float, s.split(","))) for s in sys.argv[6].split(":")]
deg0, k0 = float(sys.argv[7]), float(sys.argv[8])
src = os.path.join(HERE, "source", pid)
site = json.load(open(os.path.join(src, "site_px.json"), encoding="utf-8"))
sat = cv2.imread(cap_path)
H, W = sat.shape[:2]
mpp = 156543.03392 * math.cos(math.radians(lat)) / 2 ** z

# Drawing: road skeleton points (internal roads only; access roads may be unbuilt), in drawing px.
xs = [p[0] for r in site["roads"] for p in r["outer"]]
ys = [p[1] for r in site["roads"] for p in r["outer"]]
bw, bh = int(max(xs)) + 20, int(max(ys)) + 20
q = 4
m = np.zeros((bh // q, bw // q), np.uint8)
for r in site["roads"]:
    cv2.fillPoly(m, [(np.array(r["outer"]) / q).astype(np.int32)], 1)
    for h in r.get("holes", []):
        cv2.fillPoly(m, [(np.array(h) / q).astype(np.int32)], 0)
sk = skeletonize(m > 0)
py, px = np.nonzero(sk)
B = np.stack([px * q, py * q], 1).astype(float)
B = B[:: max(1, len(B) // 4000)]

# Imagery: roads as bright ridges (Sato filter on lightness at half resolution: carriageways 9-14 m wide), smoothed.
from skimage.filters import sato
lab = cv2.cvtColor(sat, cv2.COLOR_BGR2LAB).astype(np.float32)
Lh = cv2.resize(lab[:, :, 0], (W // 2, H // 2), interpolation=cv2.INTER_AREA) / 255.0
ridge = sato(Lh, sigmas=[4, 6, 8], black_ridges=False)
ridge = cv2.GaussianBlur((ridge / np.percentile(ridge, 99.5)).clip(0, 1).astype(np.float32), (0, 0), 2)
ridge = cv2.resize(ridge, (W, H), interpolation=cv2.INTER_LINEAR)
road = (ridge > 0.35).astype(np.uint8)
dist = cv2.distanceTransform(1 - road, cv2.DIST_L2, 5)
cv2.imwrite(os.path.splitext(cap_path)[0] + f"-{pid}-roadmask.png", road * 255)
CAP = 25.0


def M_of(t, kx, ky, cx, cy):
    c, s = math.cos(t), math.sin(t)
    return np.array([[c * kx, s * kx], [-s * ky, c * ky], [cx, cy]])  # 3x2, rows: x-coef, y-coef, shift


def cost(v):
    """Minus the mean ridge strength under the drawing's road centre-lines (points off the capture count as 0)."""
    M = M_of(*v)
    P = np.hstack([B, np.ones((len(B), 1))]) @ M
    ok = (P[:, 0] >= 0) & (P[:, 0] < W - 1) & (P[:, 1] >= 0) & (P[:, 1] < H - 1)
    if ok.sum() < len(B) * 0.5:
        return 0.0
    return -float(ridge[P[ok, 1].astype(int), P[ok, 0].astype(int)].sum() / len(B))


def start(t, k):
    M = M_of(t, k, k, 0, 0)
    sx, sy = np.array([bx0, by0, 1.0]) @ M
    return [t, k, k, sx0 - sx, sy0 - sy]


best = None
for dt in (-4, -2, 0, 2, 4):
    for dk in (0.92, 1.0, 1.08):
        v0 = start(math.radians(deg0 + dt), k0 * dk)
        r = minimize(cost, v0, method="Powell", options=dict(xtol=1e-4, ftol=1e-4, maxiter=4000))
        if best is None or r.fun < best.fun:
            best = r
        print(f"start {deg0 + dt:+.0f}deg x{dk}: score {-r.fun:.3f} -> {math.degrees(r.x[0]):.2f}deg k {r.x[1]:.4f}/{r.x[2]:.4f}")
t, kx, ky, cx, cy = best.x
M = M_of(t, kx, ky, cx, cy)
P = np.hstack([B, np.ones((len(B), 1))]) @ M
ok = (P[:, 0] >= 0) & (P[:, 0] < W - 1) & (P[:, 1] >= 0) & (P[:, 1] < H - 1)
d = dist[P[ok, 1].astype(int), P[ok, 0].astype(int)] * mpp
print(f"best: {math.degrees(t):.2f} deg, scale {kx * mpp:.4f}/{ky * mpp:.4f} m per drawing px; centre-line to road "
      f"median {np.median(d):.2f} m, 80% {np.percentile(d, 80):.2f} m")

rms = float(np.sqrt(np.mean(np.minimum(d, 8) ** 2)))
json.dump(dict(capture=dict(lat=lat, lng=lng, z=z, w=W, h=H), affine=M.tolist(), rmsMetres=round(rms, 2),
               medianMetres=round(float(np.median(d)), 2),
               method="Road network chamfer-matched to the built roads on Google satellite imagery (rotation and per-axis scale, no shear)"),
          open(os.path.join(src, "georef.json"), "w"), indent=1)

qa = sat.copy()
qa[road > 0] = (0.6 * qa[road > 0] + 0.4 * np.array([255, 255, 0])).astype(np.uint8)
tr = lambda poly: (np.hstack([np.array(poly, float), np.ones((len(poly), 1))]) @ M).astype(np.int32)
for r in site["roads"]:
    cv2.polylines(qa, [tr(r["outer"])], True, (0, 0, 255), 2)
cv2.polylines(qa, [tr(site["boundary"])], True, (0, 255, 255), 2)
if os.path.exists(os.path.join(src, "plots_px.json")):
    for p in json.load(open(os.path.join(src, "plots_px.json"), encoding="utf-8")).values():
        cv2.polylines(qa, [tr(p["poly"])], True, (255, 0, 255), 1)
cv2.imwrite(os.path.splitext(cap_path)[0] + f"-{pid}-chamfer.png", qa)
print("wrote", os.path.join(src, "georef.json"))
