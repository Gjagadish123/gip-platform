"""
Generates the artist's-impression images for the public site with kie.ai (model nano-banana-2, 2K).
Reads KIE_API_KEY from the repo-root .env. Skips any image that already exists in website/assets-src/kie.
One 2K image costs ~12 credits. Check the balance first:  python scripts/kie-generate.py --balance

Run:  python scripts/kie-generate.py            (all jobs)
      python scripts/kie-generate.py hero-aerial entrance-arch   (named jobs)
"""
import json, os, re, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
ENV = open(os.path.join(ROOT, ".env"), encoding="utf-8").read()
KEY = re.search(r'KIE_API_KEY="?([^"\n]+)', ENV).group(1).strip()
OUT = os.path.join(HERE, "..", "assets-src", "kie")
os.makedirs(OUT, exist_ok=True)

PLACE = (" Set on the dry Deccan plateau near Hyderabad, India, inside a gated plotted township. Photorealistic, natural "
         "materials, believable scale, warm golden-hour light, clean sky. No people, no faces, no text, no lettering, "
         "no signboards, no logos, no watermark.")

JOBS = {
    "hero-aerial": dict(aspect="16:9", prompt=(
        "High aerial drone photograph at golden hour of a newly developed gated residential plotted layout: a neat grid of "
        "empty plots with low kerbs and survey stones, wide pale cement-concrete roads, rows of young avenue trees with "
        "tree guards, slim LED street lights, a landscaped central park with a walking track, a white two-storey clubhouse "
        "beside a blue swimming pool, a grand entrance arch at the far end, a 100-foot main road along one edge, open "
        "scrubland and low rocky hills beyond, long warm shadows." + PLACE)),
    "entrance-arch": dict(aspect="16:9", prompt=(
        "Three-quarter eye-level view of a grand township entrance arch: two tall white pillars carrying a deep navy-blue "
        "beam across a 40-foot-wide cement concrete road, a small security cabin, a plastered compound wall, rows of young "
        "avenue trees with guards and slim LED street lights along the avenue, plotted land with low kerbs beyond, low "
        "hills far away." + PLACE)),
    "avenue-road": dict(aspect="3:2", prompt=(
        "Eye-level view down a 40-foot-wide cement concrete internal road of a plotted township: fresh pale concrete, "
        "low granite kerbs, avenue plantation of young trees with green guards on both sides, slim LED street lights, "
        "underground cable markers, empty plots with survey stones, a park on the left, soft haze at the end of the road." + PLACE)),
    "clubhouse-pool": dict(aspect="4:3", prompt=(
        "Three-quarter view of a modern two-storey white clubhouse with a flat overhanging slate-blue roof and a wide glass "
        "frontage, beside a rectangular open-air swimming pool with a pale sandstone deck and a few loungers, clipped lawn, "
        "young avenue trees with guards." + PLACE)),
    "weekend-villa": dict(aspect="3:2", prompt=(
        "A contemporary single-storey weekend villa on a 300 square yard plot in a gated plotted layout: white render, "
        "warm teak accents, a deep veranda, a small lawn with a neem tree, low compound wall with a slim gate, a cement "
        "concrete road in front, neighbouring empty plots and avenue trees." + PLACE)),
    "park-walk": dict(aspect="4:3", prompt=(
        "Landscaped neighbourhood park inside a plotted township at golden hour: a curved paver walking track, mown lawn, "
        "young flowering trees, a children's play area with a slide in the distance, benches, an overhead water tank "
        "beyond the trees, plotted land and a concrete road at the edge." + PLACE)),
    "hills-dusk": dict(aspect="21:9", prompt=(
        "Wide panoramic landscape at dusk of the Deccan plateau near Hyderabad: gentle scrubland, scattered granite "
        "boulders and a low hill line under a soft orange-to-navy sky, with a distant gated plotted layout of concrete "
        "roads and street lights just switching on. Photorealistic, calm, cinematic." + PLACE)),
    "approvals-still": dict(aspect="4:3", prompt=(
        "Overhead still life on a dark walnut desk: a rolled architectural layout plan of a plotted township partly "
        "unrolled, a brass scale ruler, a fountain pen, a stamped approval document with an embossed seal (illegible), a "
        "small potted succulent, soft window light." + PLACE)),
}


def call(url, body=None):
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body else None,
                                 headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def balance():
    return call("https://api.kie.ai/api/v1/chat/credit").get("data")


if "--balance" in sys.argv:
    print("credits:", balance())
    sys.exit(0)

names = [a for a in sys.argv[1:] if not a.startswith("-")] or list(JOBS)
print("credits before:", balance())
for name in names:
    job = JOBS[name]
    dest = os.path.join(OUT, name + ".jpg")
    if os.path.exists(dest):
        print("exists, skipping:", name)
        continue
    res = call("https://api.kie.ai/api/v1/jobs/createTask",
               dict(model="nano-banana-2", input=dict(prompt=job["prompt"], image_input=[], aspect_ratio=job["aspect"], resolution="2K", output_format="jpg")))
    task = (res.get("data") or {}).get("taskId")
    if not task:
        print("createTask failed:", res)
        continue
    print(name, "task", task, flush=True)
    for _ in range(90):
        time.sleep(5)
        info = call("https://api.kie.ai/api/v1/jobs/recordInfo?taskId=" + task).get("data") or {}
        state = info.get("state")
        if state == "success":
            url = json.loads(info["resultJson"])["resultUrls"][0]
            urllib.request.urlretrieve(url, dest)
            print("  saved", dest, os.path.getsize(dest) // 1024, "KB", flush=True)
            break
        if state == "fail":
            print("  failed:", info.get("failMsg"), flush=True)
            break
    else:
        print("  timed out", flush=True)
print("credits after:", balance())
