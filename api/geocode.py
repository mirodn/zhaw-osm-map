# Vercel Python Serverless Function
# GET /api/geocode?q=ADDRESS
import json, os
from urllib.parse import urlencode
import urllib.request


BASE = "https://nominatim.openstreetmap.org/search"
UA = os.getenv("GEOCODE_UA", "ZHAW-Map/1.0 (contact: example@example.com)")


# naive in-memory cache (ephemeral)
_cache = {}


def json_response(payload, status=200):
	return (json.dumps(payload), status, {"Content-Type": "application/json"})


def handler(request):
	q = request.args.get("q", "").strip()
	if not q:
		return json_response({"error": "missing q"}, 400)
	if q in _cache:
		return json_response(_cache[q])


	params = {
		"q": q,
		"format": "json",
		"limit": 1,
		"addressdetails": 0
	}
	url = f"{BASE}?{urlencode(params)}"
	req = urllib.request.Request(url, headers={"User-Agent": UA})
	try:
		with urllib.request.urlopen(req, timeout=8) as resp:
			data = json.loads(resp.read().decode("utf-8"))
			if not data:
				return json_response({"lat": None, "lon": None, "ok": False})
			item = data[0]
			result = {"lat": float(item["lat"]), "lon": float(item["lon"]), "ok": True}
			_cache[q] = result
			return json_response(result)
	except Exception as e:
		return json_response({"error": str(e)}, 500)


# Vercel expects a default export named handler
# (for Python Runtime v3, this is correct)