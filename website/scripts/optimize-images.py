"""
Re-encodes source images (old-site PNG/JPG, kie.ai JPGs) to WebP in website/public/images at a sensible width,
so the static GitHub Pages build (images.unoptimized) never ships a 20 MB PNG.
Edit JOBS, then:  python scripts/optimize-images.py     (skips outputs that already exist; --force redoes)
"""
import os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.normpath(os.path.join(HERE, ".."))
OLD = r"J:\Jaggu Projects\GIP Website\gipproperties\public"
KIE = os.path.join(SITE, "assets-src", "kie")
OUT = os.path.join(SITE, "src", "assets", "images")
os.makedirs(OUT, exist_ok=True)

# (source path, output name without extension, max width, quality)
JOBS = [
    (os.path.join(KIE, "entrance-arch.jpg"), "entrance-arch", 1920, 80),
    (os.path.join(KIE, "avenue-road.jpg"), "avenue-road", 1600, 80),
    (os.path.join(KIE, "clubhouse-pool.jpg"), "clubhouse-pool", 1600, 80),
    (os.path.join(KIE, "weekend-villa.jpg"), "weekend-villa", 1600, 80),
    (os.path.join(KIE, "park-walk.jpg"), "park-walk", 1600, 80),
    (os.path.join(KIE, "hills-dusk.jpg"), "hills-dusk", 2400, 78),
    (os.path.join(KIE, "approvals-still.jpg"), "approvals-still", 1600, 80),
    # Real photos from the old site
    (os.path.join(OLD, "about-us.png"), "gcvi-launch-collage", 1600, 80),
    (os.path.join(OLD, "gallery-land.png"), "gcvi-launch-collage-wide", 1920, 80),
    (os.path.join(OLD, "gallery-events.png"), "anniversary-collage", 1920, 80),
    (os.path.join(OLD, "teams", "syed-imam.png"), "team-syed-imam", 800, 82),
    # landscape event photo → 4:5 portrait around the subject (left, top, right, bottom in source px)
    (os.path.join(OLD, "teams", "syed-ismail-kashif.png"), "team-syed-ismail-kashif", 800, 82, (354, 0, 1446, 1365)),
]

force = "--force" in sys.argv
for src, name, width, q, *rest in JOBS:
    crop = rest[0] if rest else None
    dest = os.path.join(OUT, name + ".webp")
    if not os.path.exists(src):
        print("missing source, skipping:", src)
        continue
    if os.path.exists(dest) and not force:
        print("exists:", name)
        continue
    im = Image.open(src)
    im = im.convert("RGB")
    if crop:
        im = im.crop(crop)
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(dest, "WEBP", quality=q, method=6)
    print(f"{name}.webp {im.width}x{im.height} {os.path.getsize(dest)//1024} KB  (from {os.path.getsize(src)//1024} KB)")
