"""
Looks up real nearby landmarks with Google Places (New) and measures driving distance/time from each project's site pin
with the Routes API. Writes src/data/landmarks/<project-id>.json (same schema for every project).

Run:  python -P -E tools/fetch_landmarks.py [project-id ...]     (default: all four)
Reads VITE_GOOGLE_MAPS_API_KEY from .env.local (or .env); the pin comes from src/data/masterplans/<id>.json.
"""
import json, os, re, sys, time, urllib.request

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.join(HERE, "..")
ENV = next(os.path.join(APP, f) for f in (".env.local", ".env") if os.path.exists(os.path.join(APP, f)))
KEY = re.search(r'VITE_GOOGLE_MAPS_API_KEY="?([^"\n]+)', open(ENV, encoding="utf-8").read()).group(1).strip()

# (category, display name, search text). Display names are ours (None = Google's own name); everything else comes from
# Google. GC VI and GC V are a kilometre apart in Indrakaran (Kandi mandal), so they share one list.
RUDRARAM = [
    ("Education", "GITAM University, Hyderabad campus", "GITAM University Hyderabad Rudraram"),
    ("Education", "IIT Hyderabad", "Indian Institute of Technology Hyderabad Kandi"),
    ("Education", None, "school near Rudraram Patancheru"),
    ("Connectivity", "NH-65 Mumbai Highway, Rudraram", "Rudraram bus stop NH65"),
    ("Connectivity", "Outer Ring Road, Exit 2", "ORR Exit 2 Edulanagulapally"),
    ("Connectivity", "Outer Ring Road, Exit 3 (Muthangi)", "ORR Exit 3 Muthangi"),
    ("Connectivity", "Patancheru bus station", "Patancheru Bus Station"),
    ("Connectivity", "Lingampally railway station", "Lingampalli Railway Station"),
    ("Connectivity", "Miyapur metro station", "Miyapur Metro Station"),
    ("Connectivity", "Rajiv Gandhi International Airport", "Rajiv Gandhi International Airport Hyderabad"),
    ("Work hubs", "Pashamylaram industrial area", "Pashamylaram Industrial Area"),
    ("Work hubs", "Sultanpur Medical Devices Park", "Medical Devices Park Sultanpur Telangana"),
    ("Work hubs", "ICRISAT, Patancheru", "ICRISAT Patancheru"),
    ("Work hubs", "Financial District, Gachibowli", "Financial District Nanakramguda Hyderabad"),
    ("Work hubs", "HITEC City", "HITEC City Hyderabad"),
    ("Healthcare", None, "MNR Hospital Sangareddy"),
    ("Healthcare", None, "hospital Patancheru"),
    ("Town", "Sangareddy town", "Sangareddy New Bus Stand"),
    ("Town", "Isnapur crossroads", "Isnapur X Roads"),
]
QUERIES = {
    "global-city-vi": RUDRARAM,
    "global-city-v": RUDRARAM,
    # Peddapur, Sadasivpet mandal, on the Mumbai Highway west of Sangareddy
    "global-city-rrr": [
        ("Education", "IIT Hyderabad", "Indian Institute of Technology Hyderabad Kandi"),
        ("Education", "GITAM University, Hyderabad campus", "GITAM University Hyderabad Rudraram"),
        ("Education", None, "school Sadasivpet"),
        ("Connectivity", "Sadasivpet bus station", "Sadasivpet Bus Station"),
        ("Connectivity", "Sangareddy bus station", "Sangareddy New Bus Stand"),
        ("Connectivity", "Outer Ring Road, Exit 3 (Muthangi)", "ORR Exit 3 Muthangi"),
        ("Connectivity", "Patancheru bus station", "Patancheru Bus Station"),
        ("Connectivity", "Lingampally railway station", "Lingampalli Railway Station"),
        ("Connectivity", "Rajiv Gandhi International Airport", "Rajiv Gandhi International Airport Hyderabad"),
        ("Work hubs", "Sultanpur Medical Devices Park", "Medical Devices Park Sultanpur Telangana"),
        ("Work hubs", "Pashamylaram industrial area", "Pashamylaram Industrial Area"),
        ("Work hubs", "ICRISAT, Patancheru", "ICRISAT Patancheru"),
        ("Work hubs", "Financial District, Gachibowli", "Financial District Nanakramguda Hyderabad"),
        ("Healthcare", None, "MNR Hospital Sangareddy"),
        ("Healthcare", None, "hospital Sadasivpet"),
        ("Town", "Sadasivpet town", "Sadasivpet"),
        ("Town", "Sangareddy Collectorate", "Sangareddy Collectorate"),
    ],
    # Singapur village, Shankarpalli
    "western-county": [
        ("Education", None, "ICFAI Foundation for Higher Education Shankarpalli"),
        ("Education", "GITAM University, Hyderabad campus", "GITAM University Hyderabad Rudraram"),
        ("Education", None, "school Shankarpalli"),
        ("Connectivity", "Shankarpalli railway station", "Shankarpalli Railway Station"),
        ("Connectivity", "Shankarpalli bus stop", "Shankarpalli Bus Stand"),
        ("Connectivity", "Outer Ring Road, Exit 2", "ORR Exit 2 Edulanagulapally"),
        ("Connectivity", "Lingampally railway station", "Lingampalli Railway Station"),
        ("Connectivity", "Raidurg metro station", "Raidurg Metro Station"),
        ("Connectivity", "Rajiv Gandhi International Airport", "Rajiv Gandhi International Airport Hyderabad"),
        ("Work hubs", "Financial District, Gachibowli", "Financial District Nanakramguda Hyderabad"),
        ("Work hubs", "HITEC City", "HITEC City Hyderabad"),
        ("Work hubs", "Kokapet", "Kokapet Hyderabad"),
        ("Healthcare", None, "hospital Shankarpalli"),
        ("Healthcare", None, "Continental Hospitals Gachibowli"),
        ("Town", "Shankarpalli town", "Shankarpalli"),
        ("Town", "Mokila", "Mokila Hyderabad"),
    ],
}


def post(url, body, mask):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": mask})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)


def fetch(pid):
    pin = json.load(open(os.path.join(APP, "src", "data", "masterplans", f"{pid}.json"), encoding="utf-8"))["pin"]
    site = dict(latitude=pin["lat"], longitude=pin["lng"])
    out = []
    for cat, label, q in QUERIES[pid]:
        try:
            res = post(
                "https://places.googleapis.com/v1/places:searchText",
                dict(textQuery=q, maxResultCount=1, locationBias=dict(circle=dict(center=site, radius=50000.0)), regionCode="IN"),
                "places.id,places.displayName,places.location,places.formattedAddress,places.googleMapsUri,places.primaryTypeDisplayName",
            )
            pl = (res.get("places") or [None])[0]
            if not pl:
                print("  no result:", q)
                continue
            dest = pl["location"]
            # to the place, not its pin: a pin on the far carriageway of a divided highway costs a U-turn miles away
            rt = post(
                "https://routes.googleapis.com/directions/v2:computeRoutes",
                dict(origin=dict(location=dict(latLng=site)), destination=dict(placeId=pl["id"]), travelMode="DRIVE", routingPreference="TRAFFIC_UNAWARE"),
                "routes.distanceMeters,routes.duration",
            )
            r0 = (rt.get("routes") or [None])[0]
            if not r0:  # the app sorts and scales by driveKm: a place without a route is no use to it
                print("  no route:", q)
                continue
            rec = dict(
                category=cat,
                name=label or pl["displayName"]["text"],
                googleName=pl["displayName"]["text"],
                address=pl.get("formattedAddress"),
                type=(pl.get("primaryTypeDisplayName") or {}).get("text"),
                location=dict(lat=dest["latitude"], lng=dest["longitude"]),
                mapsUrl=pl.get("googleMapsUri"),
                driveKm=round(r0["distanceMeters"] / 1000, 1),
                driveMin=round(int(r0["duration"].rstrip("s")) / 60),
            )
            out.append(rec)
            print("  %-12s %-38s -> %-44s %5s km %4s min" % (cat, rec["name"][:38], rec["googleName"][:44], rec["driveKm"], rec["driveMin"]))
            time.sleep(0.15)
        except Exception as e:  # keep going: one bad lookup should not lose the rest (the message never holds the key)
            print("  FAILED", q, type(e).__name__, getattr(e, "code", ""), getattr(e, "reason", ""))
    return dict(generated=time.strftime("%Y-%m-%d"), source="Google Places API (New) + Routes API, driving without live traffic, from the site pin",
                site=dict(lat=pin["lat"], lng=pin["lng"]), places=out)


if __name__ == "__main__":
    dst = os.path.join(APP, "src", "data", "landmarks")
    os.makedirs(dst, exist_ok=True)
    for pid in sys.argv[1:] or list(QUERIES):
        print(pid)
        doc = fetch(pid)
        if not doc["places"]:
            print("  nothing fetched: left", pid, "as it was")
            continue
        with open(os.path.join(dst, f"{pid}.json"), "w", encoding="utf-8") as f:
            json.dump(doc, f, indent=1, ensure_ascii=False)
        print("  wrote", len(doc["places"]), "landmarks")
