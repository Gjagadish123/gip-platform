"""
Fits a digitised layout drawing to a Google satellite capture from hand-picked control points (road centre-line
intersections, road ends), the way Global City VI was fitted. Prints each point's residual in metres and writes
tools/layouts/source/<project-id>/georef.json plus a QA overlay beside the capture.

Run:  python -P -E tools/layouts/georef_points.py <project-id> <capture.png> <lat> <lng> <zoom> <points.json>
points.json: [[bx, by, sx, sy, "label"], ...]  (brochure px -> capture px)
"""
import json, math, os, sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
pid, cap_path, lat, lng, z, pts_path = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), int(sys.argv[5]), sys.argv[6]
src = os.path.join(HERE, "source", pid)
pts = json.load(open(pts_path, encoding="utf-8"))
P = np.array([p[:4] for p in pts], float)
mpp = 156543.03392 * math.cos(math.radians(lat)) / 2 ** z

A = np.hstack([P[:, :2], np.ones((len(P), 1))])
M_aff, *_ = np.linalg.lstsq(A, P[:, 2:], rcond=None)  # 3x2: brochure -> capture (full affine, for comparison)
res_aff = np.linalg.norm(A @ M_aff - P[:, 2:], axis=1) * mpp

# The drawings are orthogonal (rectangular plots with printed sides), only stretched differently along their two axes,
# so the model is rotation + per-axis scale + shift, no shear: s = R(t) diag(kx, ky) b + c. For a fixed angle that is
# linear in (kx, ky, cx, cy); scan the angle.
def fit_at(t):
    c, s = math.cos(t), math.sin(t)
    bx, by = P[:, 0], P[:, 1]
    rows = np.zeros((2 * len(P), 4))
    rows[0::2] = np.stack([c * bx, -s * by, np.ones_like(bx), np.zeros_like(bx)], 1)
    rows[1::2] = np.stack([s * bx, c * by, np.zeros_like(bx), np.ones_like(bx)], 1)
    rhs = P[:, 2:].reshape(-1)
    k, *_ = np.linalg.lstsq(rows, rhs, rcond=None)
    err = np.linalg.norm((rows @ k - rhs).reshape(-1, 2), axis=1)
    return k, err
t0 = math.atan2(M_aff[0, 1], M_aff[0, 0])
best = min((fit_at(t0 + math.radians(d / 100)) + (t0 + math.radians(d / 100),) for d in range(-800, 801)), key=lambda x: float(np.sum(x[1] ** 2)))
k, err, t = best
c, s = math.cos(t), math.sin(t)
M = np.array([[c * k[0], s * k[0]], [-s * k[1], c * k[1]], [k[2], k[3]]])  # 3x2, same layout as the affine
res = err * mpp
print(f"full affine rms {float(np.sqrt(np.mean(res_aff ** 2))):.2f} m; no-shear rms {float(np.sqrt(np.mean(res ** 2))):.2f} m")
for p, r in zip(pts, res):
    print(f"  {p[4] if len(p) > 4 else '':<24} residual {r:5.2f} m")
rms = float(np.sqrt(np.mean(res ** 2)))
print(f"{len(P)} points, rms {rms:.2f} m, max {res.max():.2f} m")
sx, sy = np.linalg.norm(M[0]), np.linalg.norm(M[1])
print(f"scale x {sx * mpp:.4f} m/px, y {sy * mpp:.4f} m/px, rotation {math.degrees(math.atan2(M[0, 1], M[0, 0])):.2f} deg")

json.dump(dict(capture=dict(lat=lat, lng=lng, z=z, w=int(cv2.imread(cap_path).shape[1]), h=int(cv2.imread(cap_path).shape[0])),
               pairs=[p[:4] for p in pts], labels=[p[4] if len(p) > 4 else "" for p in pts], affine=M.tolist(), rmsMetres=round(rms, 2),
               method=f"Fitted on {len(P)} road intersections and road ends against Google satellite imagery (rotation and per-axis scale, no shear)"),
          open(os.path.join(src, "georef.json"), "w"), indent=1)

sat = cv2.imread(cap_path)
site = json.load(open(os.path.join(src, "site_px.json"), encoding="utf-8"))
plots = json.load(open(os.path.join(src, "plots_px.json"), encoding="utf-8"))
tr = lambda poly: (np.hstack([np.array(poly, float), np.ones((len(poly), 1))]) @ M).astype(np.int32)
for p in plots.values():
    cv2.polylines(sat, [tr(p["poly"])], True, (255, 0, 255), 1)
for r in site["roads"]:
    cv2.polylines(sat, [tr(r["outer"])], True, (255, 255, 0), 1)
for a in site.get("accessRoads", []):
    cv2.polylines(sat, [tr(a["poly"])], True, (0, 165, 255), 1)
cv2.polylines(sat, [tr(site["boundary"])], True, (0, 255, 255), 2)
for p in P:
    q = (np.array([p[0], p[1], 1.0]) @ M).astype(int)
    cv2.circle(sat, (int(p[2]), int(p[3])), 4, (0, 0, 255), 2)
    cv2.line(sat, (int(p[2]), int(p[3])), tuple(q), (0, 255, 0), 2)
cv2.imwrite(os.path.splitext(cap_path)[0] + f"-{pid}-points.png", sat)
