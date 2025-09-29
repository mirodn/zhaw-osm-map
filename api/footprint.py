# GET /api/footprint?lat=47.498&lon=8.723&radius=120&name=Technoparkstrasse%201
import json

OVERPASS = "https://overpass-api.de/api/interpreter"


# Duplicate json_response function removed to avoid obscuring the original declaration.


def overpass(query: str):
    import urllib.request
    data = query.encode('utf-8')
    req = urllib.request.Request(OVERPASS, data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
    with urllib.request.urlopen(req, timeout=25) as resp:
        return json.loads(resp.read().decode('utf-8'))


def handler(request):
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
    except:
        return json_response({"error": "missing lat/lon"}, 400)
    radius = int(request.args.get("radius", 120))
    name = request.args.get("name", "")

    query = f"""
[out:json][timeout:25];
(
way["building"](around:{radius},{lat},{lon});
relation["building"](around:{radius},{lat},{lon});
);
out ids tags center;
>; out skel qt;
"""


    try:
        data = overpass(query)
        # Naive pick: prefer objects with name or addr:housenumber/addr:street
        best = None
        for el in data.get('elements', []):
            tags = el.get('tags', {})
            if name and name.lower() in (tags.get('name','') + ' ' + tags.get('addr:street','') + ' ' + tags.get('addr:housenumber','')).lower():
                best = el
                break
            if not best and 'building' in tags:
                best = el
        if not best:
            return json_response({"features": []})
        # Minimal GeoJSON point (center) — polygon assembly omitted for brevity
        center = best.get('center')
        if center:
            gj = {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [center['lon'], center['lat']]},
                    "properties": {"id": best.get('id'), "tags": best.get('tags', {})}
                }]
            }
            return json_response(gj)
        return json_response({"features": []})
    except Exception as e:
        return json_response({"error": str(e)}, 500)


def json_response(payload, status=200):
    return (json.dumps(payload), status, {"Content-Type": "application/json"})