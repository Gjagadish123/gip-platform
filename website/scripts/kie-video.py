"""
Animates one still into a short drone clip with kie.ai (Hailuo 2.3 standard image-to-video, 6 s, 1080P = 50 credits).
Reads KIE_API_KEY from the repo-root .env and never prints it. Uploads the still via kie's base64 file upload, creates
the task, polls recordInfo, and downloads the MP4 into website/assets-src/kie/ (gitignored).

Run:  python scripts/kie-video.py hero-aerial
"""
import base64, io, json, os, re, sys, time, urllib.request

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
KEY = re.search(r'KIE_API_KEY="?([^"\n]+)', open(os.path.join(ROOT, ".env"), encoding="utf-8").read()).group(1).strip()
SRC = os.path.join(HERE, "..", "assets-src", "kie")
API = "https://api.kie.ai/api/v1"
UPLOAD = "https://kieai.redpandaai.co/api"

JOBS = {
    "hero-aerial": (
        "Slow, perfectly steady cinematic drone shot at golden hour. The camera glides forward and very gently descends "
        "over the gated plotted layout toward the white clubhouse and blue pool, one continuous move with no cuts and no "
        "rotation. Long warm shadows, young avenue trees swaying slightly in a light breeze, a faint dust haze over the "
        "scrubland, a single car moving slowly along the main road. Photorealistic, natural colour, crisp detail, "
        "no people close up, no text, no logos, no watermark."
    ),
    "entrance-arch": (
        "Cinematic gimbal shot at golden hour: the camera glides slowly and perfectly steadily forward along the road and "
        "passes under the white entrance arch, revealing the plotted layout and the hills beyond. One continuous move, no "
        "cuts, no rotation. Warm low sun, long soft shadows, light lens flare, a gentle breeze in the young trees. "
        "Photorealistic, natural colour, crisp detail, no people close up, no text, no logos, no watermark."
    ),
    "hills-dusk": (
        "Slow cinematic drone shot at blue hour: the camera glides forward and slightly descends over the scrubland "
        "toward the gated plotted layout, whose street lights glow warm against the darkening hills; the sky fades from "
        "orange to deep blue. One continuous steady move, no cuts, no rotation. Photorealistic, moody, crisp detail, no "
        "text, no logos, no watermark."
    ),
    "avenue-road": (
        "Low cinematic drone shot at sunset gliding slowly and steadily forward down the wide tree-lined avenue of the "
        "plotted layout, street lamps and young trees passing on both sides, the hills glowing on the horizon. One "
        "continuous move, no cuts, no rotation. Warm golden light, gentle breeze in the leaves, photorealistic, crisp "
        "detail, no people close up, no text, no logos, no watermark."
    ),
}


def call(path, payload=None, base=API):
    req = urllib.request.Request(
        f"{base}/{path}",
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
        method="POST" if payload is not None else "GET",
    )
    return json.loads(urllib.request.urlopen(req, timeout=120).read())


def upload(name):
    im = Image.open(os.path.join(SRC, f"{name}.jpg")).convert("RGB")
    im.thumbnail((1920, 1920))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=90)
    data = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    # kie's file host lives on its own domain; uploads are kept for 3 days.
    r = call("file-base64-upload", {"base64Data": data, "uploadPath": "gip", "fileName": f"{name}-src.jpg"}, base=UPLOAD)
    d = r.get("data") or {}
    url = d.get("downloadUrl") or d.get("fileUrl") or d.get("url")
    if not url:
        sys.exit(f"upload failed: {json.dumps(r)[:300]}")
    return url


def main(name):
    out = os.path.join(SRC, f"{name}.mp4")
    if os.path.exists(out):
        print("exists:", out)
        return
    print("credits before:", call("chat/credit").get("data"))
    image_url = upload(name)
    r = call("jobs/createTask", {
        "model": "hailuo/2-3-image-to-video-standard",
        "input": {"prompt": JOBS[name], "image_url": image_url, "duration": "6", "resolution": "1080P"},
    })
    task = (r.get("data") or {}).get("taskId")
    if not task:
        sys.exit(f"createTask failed: {json.dumps(r)[:300]}")
    print("task:", task)
    for _ in range(120):
        time.sleep(10)
        d = call(f"jobs/recordInfo?taskId={task}").get("data") or {}
        state = d.get("state")
        print("state:", state, flush=True)
        if state == "success":
            urls = json.loads(d.get("resultJson") or "{}").get("resultUrls") or []
            urllib.request.urlretrieve(urls[0], out)
            print("saved:", out, os.path.getsize(out) // 1024, "KB")
            print("credits after:", call("chat/credit").get("data"))
            return
        if state == "fail":
            sys.exit(f"failed: {d.get('failMsg') or d.get('failCode')}")
    sys.exit("timed out")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "hero-aerial")
