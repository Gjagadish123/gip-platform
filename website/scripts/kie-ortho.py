"""
A top-down "orthophoto" impression of the real Global City VI layout, for the hero's plan registration.
1. Renders the approved plan (src/lib/data/gc6-masterplan.json) as a flat diagram in the hero's frame: the plots'
   bounding box padded 14 % (as plotsViewBox(plan, 0.14)), widened to 2:3.
2. Asks kie.ai Nano Banana edit (4 credits) to turn that diagram into a photoreal top-down view, same framing.
Outputs (gitignored assets-src/kie/): ortho-ref.png (the diagram), ortho-<n>.png (each attempt).
Reads KIE_API_KEY from the repo-root .env and never prints it.

Run:  python scripts/kie-ortho.py ref        (diagram only, free)
      python scripts/kie-ortho.py gen        (one attempt)
"""
import base64, io, json, os, re, sys, time, urllib.request

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.normpath(os.path.join(HERE, ".."))
ROOT = os.path.normpath(os.path.join(SITE, ".."))
OUT = os.path.join(SITE, "assets-src", "kie")
PLAN = json.load(open(os.path.join(SITE, "src", "lib", "data", "gc6-masterplan.json"), encoding="utf-8"))
ASPECT = 2 / 3  # width / height
W, H = 1024, 1536


def frame():
    """Hero frame in flipped plan units (x east, y south), matching hero.tsx."""
    pts = [(x, -y) for p in PLAN["plots"] for x, y in p["xy"]]
    x0, x1 = min(p[0] for p in pts), max(p[0] for p in pts)
    y0, y1 = min(p[1] for p in pts), max(p[1] for p in pts)
    m = max(x1 - x0, y1 - y0) * 0.14 / 2
    x, y, w, h = x0 - m, y0 - m, x1 - x0 + 2 * m, y1 - y0 + 2 * m
    if w / h < ASPECT:
        nw = h * ASPECT
        x -= (nw - w) / 2
        w = nw
    else:
        nh = w / ASPECT
        y -= (nh - h) / 2
        h = nh
    return x, y, w, h


def diagram():
    fx, fy, fw, fh = frame()
    sx = W / fw
    to = lambda xy: [((x - fx) * sx, (-y - fy) * sx) for x, y in xy]
    im = Image.new("RGB", (W, H), (196, 178, 140))  # scrubland
    d = ImageDraw.Draw(im)
    for ring in PLAN["road100"]:  # the 100 ft public highway: asphalt with a centre line
        d.polygon(to(ring["outer"]), fill=(70, 72, 76))
    d.polygon(to(PLAN["boundary"]), fill=(214, 214, 210))  # site ground
    for ring in PLAN["roads"]:
        d.polygon(to(ring["outer"]), fill=(232, 232, 228))
        for hole in ring["holes"]:
            d.polygon(to(hole), fill=(214, 214, 210))
    for ring in PLAN["greens"]:
        d.polygon(to(ring["outer"]), fill=(120, 170, 95))
    for p in PLAN["plots"]:
        d.polygon(to(p["xy"]), fill=(170, 120, 85), outline=(245, 245, 240))
    d.line(to(PLAN["boundary"]) + to(PLAN["boundary"][:1]), fill=(90, 90, 90), width=4)
    return im


KEY = None
API = "https://api.kie.ai/api/v1"
UPLOAD = "https://kieai.redpandaai.co/api"
PROMPT = (
    "Turn this flat site-plan diagram into a photorealistic straight-down aerial orthophoto (satellite view, camera "
    "pointing exactly down, no perspective, no tilt) of the same newly built gated plotted layout near Hyderabad, India. "
    "Keep the exact framing and keep every road, plot and boundary exactly where it is in the diagram: the pale grey "
    "bands are cement-concrete roads with thin kerbs and young avenue trees along them; the brown blocks are individual "
    "demarcated bare soil plots, each separated by a thin pale boundary line with small white survey stones at the "
    "corners; green areas are young landscaped parks with lawns and small trees; the dark outline is a plastered "
    "compound wall; the dark grey band with a white centre line is a public asphalt highway with lane markings and a "
    "few cars. Everything outside the dark outline, other than that highway, is undeveloped dry Deccan scrubland with "
    "scattered bushes and a few granite boulders: no parks, no walls, no paths and no buildings outside the outline. Soft morning "
    "light, short natural shadows, crisp detail. No text, no labels, no numbers, no people, no watermark."
)


def call(path, payload=None, base=API):
    req = urllib.request.Request(
        f"{base}/{path}",
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
        method="POST" if payload is not None else "GET",
    )
    return json.loads(urllib.request.urlopen(req, timeout=120).read())


def generate():
    global KEY
    KEY = re.search(r'KIE_API_KEY="?([^"\n]+)', open(os.path.join(ROOT, ".env"), encoding="utf-8").read()).group(1).strip()
    print("credits before:", call("chat/credit").get("data"))
    buf = io.BytesIO()
    diagram().save(buf, "PNG")
    up = call("file-base64-upload", {"base64Data": "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode(), "uploadPath": "gip", "fileName": "ortho-ref.png"}, base=UPLOAD)
    url = (up.get("data") or {}).get("downloadUrl")
    if not url:
        sys.exit(f"upload failed: {json.dumps(up)[:300]}")
    r = call("jobs/createTask", {"model": "google/nano-banana-edit", "input": {"prompt": PROMPT, "image_urls": [url], "output_format": "png", "image_size": "2:3"}})
    task = (r.get("data") or {}).get("taskId")
    if not task:
        sys.exit(f"createTask failed: {json.dumps(r)[:400]}")
    print("task:", task)
    for _ in range(90):
        time.sleep(6)
        d = call(f"jobs/recordInfo?taskId={task}").get("data") or {}
        state = d.get("state")
        if state == "success":
            urls = json.loads(d.get("resultJson") or "{}").get("resultUrls") or []
            n = 1
            while os.path.exists(os.path.join(OUT, f"ortho-{n}.png")):
                n += 1
            dest = os.path.join(OUT, f"ortho-{n}.png")
            urllib.request.urlretrieve(urls[0], dest)
            print("saved:", dest, Image.open(dest).size)
            print("credits after:", call("chat/credit").get("data"))
            return
        if state == "fail":
            sys.exit(f"failed: {d.get('failMsg') or d.get('failCode')}")
    sys.exit("timed out")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    if len(sys.argv) > 1 and sys.argv[1] == "gen":
        generate()
    else:
        diagram().save(os.path.join(OUT, "ortho-ref.png"))
        print("frame", [round(v, 2) for v in frame()])
