"""
Checks the live-layout geometry and the seed against each other. Exits non-zero on any failure.

- every digitised plan: plot numbers 1..plotCount exactly once, valid outlines, plot and zone label points inside, areas summing to
  the printed plotted area within 0.2 %, a satellite fit within 3 m, plots drawn at one scale (a fit that squeezes or
  stretches a block shows up as plots whose drawn area strays from the printed one);
- the admin and website copies are identical;
- supabase/seed.sql has the same plot numbers and areas as each drawing.

Run:  python -P -E tools/layouts/check_layouts.py
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
ADMIN = os.path.join(REPO, "admin", "src", "lib", "layouts")
WEBSITE = os.path.abspath(os.path.join(REPO, "..", "gip-platform-website", "website", "src", "lib", "data", "layouts"))
fails = []


def check(ok, msg):
    if not ok:
        fails.append(msg)


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


def area(r):
    return abs(sum(r[i][0] * r[(i + 1) % len(r)][1] - r[(i + 1) % len(r)][0] * r[i][1] for i in range(len(r)))) / 2


seed = open(os.path.join(REPO, "supabase", "seed.sql"), encoding="utf-8").read()
seed_units = {}
for m in re.finditer(r"select private\.insert_units\('([a-z0-9-]+)', \$seed\$(.*?)\$seed\$", seed, re.S):
    seed_units[m.group(1)] = {u["number"]: float(u["area"]) for u in json.loads(m.group(2))}

for name in sorted(os.listdir(ADMIN)):
    if not name.endswith(".json") or name == "index.json":
        continue
    doc = json.load(open(os.path.join(ADMIN, name), encoding="utf-8"))
    pid = doc["id"]
    if os.path.isdir(WEBSITE):
        web = os.path.join(WEBSITE, name)
        check(os.path.exists(web) and open(web, encoding="utf-8").read() == open(os.path.join(ADMIN, name), encoding="utf-8").read(),
              f"{pid}: website copy differs from the admin copy (rerun build_layouts.py)")
    plots = doc["plots"]
    if not plots:
        check(doc["source"].get("pending") is True, f"{pid}: no plots but not marked pending")
        print(f"{pid}: no plot outlines (drawing pending), pin {doc['pin']['lat']:.5f}, {doc['pin']['lng']:.5f}")
        continue
    nums = [p["n"] for p in plots]
    check(sorted(nums, key=int) == [str(i) for i in range(1, doc["plotCount"] + 1)], f"{pid}: plot numbers are not exactly 1..{doc['plotCount']}")
    for p in plots:
        check(len(p["xy"]) >= 3 and area(p["xy"]) > 20, f"{pid}: plot {p['n']} outline is degenerate")
        check(pip(p["c"], p["xy"]), f"{pid}: plot {p['n']} label point is outside its outline")
        if "w" in p:
            check(abs(p["w"] * p["d"] / 9 - p["a"]) / p["a"] < 0.01, f"{pid}: plot {p['n']} size {p['w']}x{p['d']} does not give {p['a']} sq yd")
    for z in doc["zones"]:  # names are drawn centred on c, shown only while they fit in `room`
        check(pip(z["c"], z["xy"]) and min(z["room"]) > 0, f"{pid}: zone {z['id']} label point is outside its outline")
    # Drawn (fitted) area over printed area is the same for every plot, give or take the digitising: at most 2 % of
    # plots may stray beyond 15 %, and none below 70 % or above 140 % of the median (Global City VI's plot 57 is +34 %).
    scale = sorted(area(p["xy"]) * 1.19599 / p["a"] for p in plots)
    off = [r / scale[len(scale) // 2] for r in scale if not 0.85 <= r / scale[len(scale) // 2] <= 1.15]
    check(len(off) <= 0.02 * len(plots) and all(0.7 <= r <= 1.4 for r in off),
          f"{pid}: {len(off)} plots are drawn at a different scale from the rest ({min(off, default=1):.2f}..{max(off, default=1):.2f} of the median)")
    total = sum(p["a"] for p in plots)
    printed = doc["landUse"][0]["sqyd"] if doc["landUse"] else total
    check(abs(total - printed) / printed < 0.002, f"{pid}: plot areas sum to {total:.2f}, printed plotted area {printed}")
    check(doc["georef"] and doc["georef"]["rmsMetres"] <= 3, f"{pid}: satellite fit {doc['georef']} is worse than 3 m")
    s = seed_units.get(pid)
    check(s is not None, f"{pid}: no units in supabase/seed.sql")
    if s is not None:
        drawn = {p["n"]: float(p["a"]) for p in plots}
        check(set(s) == set(drawn), f"{pid}: seed plot numbers differ from the drawing ({len(s)} vs {len(drawn)})")
        bad = [n for n in drawn if n in s and abs(s[n] - drawn[n]) > 0.01]
        check(not bad, f"{pid}: seed areas differ from the drawing for plots {bad[:10]}")
    print(f"{pid}: {len(plots)} plots, area sum {total:,.2f} (printed {printed:,.2f}), fit {doc['georef']['rmsMetres']} m, "
          f"{sum('f' in p for p in plots)} with facing, {sum('w' in p for p in plots)} with sizes")

if fails:
    print("\nFAILED:\n  " + "\n  ".join(fails))
    sys.exit(1)
print("\nall layout checks passed")
