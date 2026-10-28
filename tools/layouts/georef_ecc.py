"""
Fits a digitised layout drawing to Google satellite imagery: brochure pixels -> satellite capture pixels, affine.

The drawing's road network (site_px.json: internal roads + access roads) is matched to the built roads on a
satellite capture (bright, unsaturated CC carriageways) by ECC image alignment, starting from a rough guess of
three corresponding points. The residual is reported honestly as the median distance (metres) from the fitted
drawing's road centre-lines to the nearest road pixel on the imagery.

Run:  python -P -E tools/layouts/georef_ecc.py <project-id> <capture.png> <lat> <lng> <zoom> "bx,by:sx,sy;bx,by:sx,sy;bx,by:sx,sy"
Writes tools/layouts/source/<project-id>/georef.json (+ a QA overlay next to the capture).
"""
import json, math, os, sys

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
pid, cap_path, lat, lng, z, guess = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), int(sys.argv[5]), sys.argv[6]
src = os.path.join(HERE, "source", pid)
site = json.load(open(os.path.join(src, "site_px.json"), encoding="utf-8"))
sat = cv2.imread(cap_path)
H, W = sat.shape[:2]
mpp = 156543.03392 * math.cos(math.radians(lat)) / 2 ** z

# --- brochure road mask (internal roads + access roads), in brochure pixels
bro_w = int(max(max(p[0] for r in site["roads"] for p in r["outer"]), max(p[0] for p in site["boundary"]))) + 50
bro_h = int(max(max(p[1] for r in site["roads"] for p in r["outer"]), max(p[1] for p in site["boundary"]))) + 50
bro = np.zeros((bro_h, bro_w), np.uint8)
for r in site["roads"]:
    cv2.fillPoly(bro, [np.array(r["outer"], np.int32)], 255)
    for h in r.get("holes", []):
        cv2.fillPoly(bro, [np.array(h, np.int32)], 0)
for a in site.get("accessRoads", []):
    cv2.fillPoly(bro, [np.array(a["poly"], np.int32)], 255)

# --- satellite road mask: bright, low-saturation carriageway
hsv = cv2.cvtColor(sat, cv2.COLOR_BGR2HSV)
road = ((hsv[:, :, 1] < 70) & (hsv[:, :, 2] > 150)).astype(np.uint8) * 255
road = cv2.morphologyEx(road, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))

# --- initial affine from the rough guess (brochure -> satellite)
pairs = [tuple(map(float, a.split(","))) + tuple(map(float, b.split(","))) for a, b in (p.split(":") for p in guess.split(";"))]
A0 = cv2.getAffineTransform(np.float32([p[:2] for p in pairs]), np.float32([p[2:] for p in pairs]))

# Restrict the satellite mask to the drawing's footprint (dilated), so the village roads and roofs don't pull the fit.
foot = np.zeros((bro_h, bro_w), np.uint8)
cv2.fillPoly(foot, [np.array(site["boundary"], np.int32)], 255)
for a in site.get("accessRoads", []):
    cv2.fillPoly(foot, [np.array(a["poly"], np.int32)], 255)
foot_s = cv2.warpAffine(foot, A0, (W, H))
foot_s = cv2.dilate(foot_s, np.ones((61, 61), np.uint8))
road_in = cv2.bitwise_and(road, foot_s)

# ECC finds W: satellite px -> brochure px with sat_mask(x) ~ bro_mask(W x). Coarse to fine on blurred masks.
Ainv = cv2.invertAffineTransform(A0).astype(np.float32)
warp = Ainv.copy()
for sigma in (25, 12, 6):
    t = cv2.GaussianBlur(road_in.astype(np.float32) / 255, (0, 0), sigma)
    i = cv2.GaussianBlur(bro.astype(np.float32) / 255, (0, 0), sigma * (1 / max(abs(A0[0, 0]) + abs(A0[0, 1]), 1e-6)))
    try:
        cc, warp = cv2.findTransformECC(t, i, warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 500, 1e-7), None, 5)
        print(f"sigma {sigma}: ecc {cc:.4f}")
    except cv2.error as e:
        print(f"sigma {sigma}: ECC did not converge ({e.err})")
A = cv2.invertAffineTransform(warp)  # brochure -> satellite

# --- residual: road centre-lines of the drawing vs road pixels on the imagery
skel = cv2.ximgproc.thinning(bro) if hasattr(cv2, "ximgproc") else None
if skel is None:
    dist_b = cv2.distanceTransform(255 - cv2.bitwise_not(bro), cv2.DIST_L2, 3)
    ys, xs = np.where((bro > 0) & (cv2.erode(bro, np.ones((3, 3), np.uint8)) == 0))  # road edges instead
else:
    ys, xs = np.where(skel > 0)
pts = np.stack([xs, ys, np.ones_like(xs)], 1).astype(np.float64) @ A.T
inside = (pts[:, 0] >= 0) & (pts[:, 0] < W) & (pts[:, 1] >= 0) & (pts[:, 1] < H)
dist_s = cv2.distanceTransform(255 - road, cv2.DIST_L2, 5)
d = dist_s[pts[inside, 1].astype(int), pts[inside, 0].astype(int)] * mpp
print(f"centre-line to imagery road: median {np.median(d):.2f} m, 75% {np.percentile(d, 75):.2f} m, 90% {np.percentile(d, 90):.2f} m over {inside.sum()} px")

out = dict(capture=dict(lat=lat, lng=lng, z=z, w=W, h=H), affine=np.vstack([A[:, :2].T, A[:, 2]]).tolist(),
           rmsMetres=round(float(np.sqrt(np.mean(np.minimum(d, 10) ** 2))), 2), medianMetres=round(float(np.median(d)), 2),
           method="ECC alignment of the drawing's road network to the built roads on Google satellite imagery", guess=pairs)
json.dump(out, open(os.path.join(src, "georef.json"), "w"), indent=1)

# --- QA overlay: drawing roads (cyan) and plots (magenta) on the capture
qa = sat.copy()
plots = json.load(open(os.path.join(src, "plots_px.json"), encoding="utf-8"))
def tr(poly):
    return (np.hstack([np.array(poly, np.float64), np.ones((len(poly), 1))]) @ A.T).astype(np.int32)
for r in site["roads"]:
    cv2.polylines(qa, [tr(r["outer"])], True, (255, 255, 0), 1)
for a in site.get("accessRoads", []):
    cv2.polylines(qa, [tr(a["poly"])], True, (0, 165, 255), 1)
for p in plots.values():
    cv2.polylines(qa, [tr(p["poly"])], True, (255, 0, 255), 1)
cv2.polylines(qa, [tr(site["boundary"])], True, (0, 255, 255), 2)
cv2.imwrite(os.path.splitext(cap_path)[0] + f"-{pid}-fit.png", qa)
print("wrote", os.path.join(src, "georef.json"))
