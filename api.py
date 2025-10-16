from flask import Flask, jsonify, request, send_file, abort, Response
from flask_cors import CORS
from flask_caching import Cache
import requests, os, time, re
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
from pathlib import Path
from urllib.parse import urlparse

# -------------------------
# App & Extensions
# -------------------------
app = Flask(__name__)

CORS(
    app,
    resources={r"/api/*": {"origins": [
        "http://localhost:4173", "http://127.0.0.1:4173",
        "http://localhost:5173", "http://127.0.0.1:5173",
    ]}},
    supports_credentials=True,
)

cache = Cache(app, config={"CACHE_TYPE": "SimpleCache", "CACHE_DEFAULT_TIMEOUT": 300})

IMG_CACHE_DIR = Path(__file__).parent / "cache" / "images"
IMG_CACHE_DIR.mkdir(parents=True, exist_ok=True)

# -------------------------
# HTTP session (pool + retry)
# -------------------------
def make_session():
    s = requests.Session()
    s.headers.update({"User-Agent": "MocoManga/1.0 (+https://example.local)"})
    retry = Retry(
        total=3, backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"]
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=100, pool_maxsize=100)
    s.mount("https://", adapter)
    s.mount("http://", adapter)
    return s

session = make_session()

BASE_URL = "https://api.mangadex.org"
UPLOADS = "https://uploads.mangadex.org"
UUID_RE = re.compile(r"^[0-9a-fA-F-]{36}$")

# Domain yang boleh diproxy di /api/img/relay
RELAY_ALLOW_HOSTS = {
    "mangadex.network",
    "uploads.mangadex.org",
}

def host_allowed(netloc: str) -> bool:
    netloc = netloc.lower()
    if netloc.endswith(".mangadex.network"):
        return True
    return netloc in RELAY_ALLOW_HOSTS

# -------------------------
# Utilities
# -------------------------
def chunked(iterable, size):
    it = list(iterable)
    for i in range(0, len(it), size):
        yield it[i:i+size]

def cover_map_for(manga_ids):
    result = {}
    for batch in chunked(manga_ids, 100):
        params = [("limit", 100)]
        for mid in batch:
            params.append(("manga[]", mid))
        r = session.get(f"{BASE_URL}/cover", params=params, timeout=20)
        r.raise_for_status()
        data = r.json()
        for item in data.get("data", []):
            rels = item.get("relationships", [])
            mid = next((rel.get("id") for rel in rels if rel.get("type") == "manga"), None)
            fname = item.get("attributes", {}).get("fileName")
            if mid and fname:
                result[mid] = fname
    return result

def normalize_title(attr):
    t = attr.get("title") or {}
    return t.get("en") or next(iter(t.values()), "Untitled")

def normalize_desc(attr):
    d = attr.get("description") or {}
    return d.get("en") or next(iter(d.values()), "")

def normalize_genres(attr):
    tags = attr.get("tags") or []
    out = []
    for t in tags:
        name = (t.get("attributes") or {}).get("name") or {}
        g = name.get("en") or next(iter(name.values()), None)
        if g: out.append(g)
    return out

def resolve_mangadex_manga_id(slug_or_id: str):
    if UUID_RE.match(slug_or_id):
        return slug_or_id
    slug_map = app.config.setdefault("SLUG_TO_MANGAID", {})
    if slug_or_id in slug_map:
        return slug_map[slug_or_id]
    title_query = slug_or_id.replace("-", " ").strip()
    params = {"limit": 1, "title": title_query, "order[relevance]": "desc"}
    r = session.get(f"{BASE_URL}/manga", params=params, timeout=20)
    if not r.ok:
        return None
    data = r.json()
    if not data.get("data"):
        return None
    md_id = data["data"][0]["id"]
    slug_map[slug_or_id] = md_id
    return md_id

# -------------------------
# API Endpoints
# -------------------------
@app.get("/api/health")
def health():
    return {"ok": True, "ts": int(time.time())}

@app.get("/api/manga")
@cache.cached(timeout=180, query_string=True)
def list_manga():
    q = request.args.get("q") or None
    letter = request.args.get("letter") or None
    sort = (request.args.get("sort") or "latest").lower()
    page = max(1, int(request.args.get("page", 1)))
    limit = max(1, min(100, int(request.args.get("limit", 24))))

    order_map = {
        "latest": ("latestUploadedChapter", "desc"),
        "updated": ("updatedAt", "desc"),
        "popular": ("followedCount", "desc"),
        "az": ("title", "asc"),
    }
    order_key, order_dir = order_map.get(sort, ("latestUploadedChapter", "desc"))

    md_params = {
        "limit": limit,
        "offset": (page - 1) * limit,
        f"order[{order_key}]": order_dir,
    }
    if q:
        md_params["title"] = q

    r = session.get(f"{BASE_URL}/manga", params=md_params, timeout=20)
    r.raise_for_status()
    payload = r.json()
    items = payload.get("data", [])

    ids = [m["id"] for m in items if "id" in m]
    cov = cover_map_for(ids)

    out = []
    for m in items:
        mid = m["id"]
        attr = m.get("attributes", {}) or {}
        title = normalize_title(attr)
        if letter and not title.upper().startswith(letter.upper()):
            continue
        out.append({
            "id": mid,
            "title": title,
            "status": attr.get("status"),
            "description": normalize_desc(attr),
            "cover": f"/api/img/covers/{mid}/{cov[mid]}" if mid in cov else None,
            "genres": normalize_genres(attr),
            "type": (attr.get("publicationDemographic") or "").lower(),
            "popularity": attr.get("followedCount", 0),
            "updatedAt": attr.get("updatedAt"),
            "createdAt": attr.get("createdAt"),
        })

    return jsonify({
        "manga": out,
        "limit": limit,
        "page": page,
        "total": payload.get("total", 0),
    })

@app.get("/api/manga/<slug_or_id>")
@cache.cached(timeout=600)
def manga_detail(slug_or_id):
    md_id = resolve_mangadex_manga_id(slug_or_id) or slug_or_id
    if not UUID_RE.match(md_id):
        r = session.get(f"{BASE_URL}/manga", params={"title": slug_or_id, "limit": 1}, timeout=20)
        r.raise_for_status()
        data = r.json()
        if not data.get("data"):
            return jsonify({"error": "Manga not found"}), 404
        m = data["data"][0]
    else:
        r = session.get(f"{BASE_URL}/manga/{md_id}", timeout=20)
        r.raise_for_status()
        data = r.json()
        m = data.get("data")
        if not m:
            return jsonify({"error": "Manga not found"}), 404

    mid = m["id"]
    attr = m.get("attributes", {}) or {}
    cov = cover_map_for([mid])
    cover_url = f"/api/img/covers/{mid}/{cov[mid]}" if mid in cov else None

    return {
        "id": mid,
        "title": normalize_title(attr),
        "status": attr.get("status"),
        "description": normalize_desc(attr),
        "cover": cover_url,
        "genres": normalize_genres(attr),
    }

@app.get("/api/manga/<slug_or_id>/chapters")
@cache.cached(timeout=120, query_string=True)
def chapters(slug_or_id):
    sort = (request.args.get("sort") or "asc").lower()
    page = max(1, int(request.args.get("page", 1)))
    want = max(1, int(request.args.get("limit", 100)))
    lang = request.args.get("translatedLanguage")

    md_id = resolve_mangadex_manga_id(slug_or_id)
    if not md_id:
        return jsonify({"chapters": [], "total": 0, "error": "manga_not_found"}), 404

    collected = []
    offset = (page - 1) * 100
    order_dir = "asc" if sort == "asc" else "desc"

    while len(collected) < want:
        take = min(100, want - len(collected))
        params = {
            "manga": md_id,
            "limit": take,
            "offset": offset,
            "order[chapter]": order_dir,
        }
        if lang:
            params["translatedLanguage[]"] = lang

        r = session.get(f"{BASE_URL}/chapter", params=params, timeout=30)
        if not r.ok:
            return jsonify({
                "chapters": collected,
                "total": len(collected),
                "upstream_status": r.status_code,
                "upstream_detail": r.text
            }), 502

        payload = r.json() or {}
        data = payload.get("data", [])
        if not data:
            break

        for ch in data:
            attr = ch.get("attributes", {}) or {}
            collected.append({
                "id": ch.get("id"),
                "title": attr.get("title") or (f"Chapter {attr.get('chapter')}" if attr.get("chapter") else "Chapter"),
                "number": attr.get("chapter"),
                "pages": attr.get("pages"),
                "releaseDate": attr.get("publishAt") or attr.get("readableAt") or attr.get("createdAt"),
                "language": attr.get("translatedLanguage"),
            })

        if len(data) < take:
            break
        offset += take

    return jsonify({"chapters": collected, "total": len(collected)})

@app.get("/api/chapter/<chapter_id>")
@cache.cached(timeout=60, query_string=True)
def chapter_images(chapter_id):
    q = (request.args.get("quality") or "auto").lower()
    title = None

    meta = session.get(f"{BASE_URL}/chapter/{chapter_id}", timeout=20)
    if meta.ok:
        j = meta.json() or {}
        attr = (j.get("data") or {}).get("attributes") or {}
        title = attr.get("title") or (f"Chapter {attr.get('chapter')}" if attr.get("chapter") else "Chapter")

    r = session.get(f"{BASE_URL}/at-home/server/{chapter_id}", timeout=20)
    r.raise_for_status()
    data = r.json() or {}

    base = data.get("baseUrl")
    chinfo = data.get("chapter") or {}
    h = chinfo.get("hash")

    use_saver = True if q in ("auto", "saver") and chinfo.get("dataSaver") else False
    files = (chinfo.get("dataSaver") if use_saver else chinfo.get("data")) or []

    folder = "data-saver" if use_saver else "data"
    pages = [f"{base}/{folder}/{h}/{fn}" for fn in files]

    return jsonify({"id": chapter_id, "title": title, "pages": pages})

# -------------------------
# Image Cover Proxy (disk cache)
# -------------------------
@app.get("/api/img/covers/<manga_id>/<file_name>")
def proxy_cover(manga_id, file_name):
    safe_name = f"{manga_id}_{file_name}".replace("/", "_")
    disk_path = IMG_CACHE_DIR / safe_name

    if disk_path.exists():
        return send_file(
            disk_path,
            mimetype=None,
            conditional=True,
            last_modified=time.gmtime(os.path.getmtime(disk_path))
        )

    url = f"{UPLOADS}/covers/{manga_id}/{file_name}"
    upstream = session.get(url, timeout=(5, 30), stream=True, headers={"Referer": "https://mangadex.org/"})
    if upstream.status_code != 200:
        abort(upstream.status_code)

    with open(disk_path, "wb") as f:
        for chunk in upstream.iter_content(8192):
            if chunk:
                f.write(chunk)

    return send_file(str(disk_path), mimetype=upstream.headers.get("Content-Type", "image/jpeg"))

# -------------------------
# Generic Relay (fix 403 & ISP resets)
# -------------------------
@app.get("/api/img/relay")
def relay_image():
    target = request.args.get("u")
    if not target:
        abort(400)

    try:
        parsed = urlparse(target)
    except Exception:
        abort(400)

    if not parsed.scheme.startswith("http"):
        abort(400)
    if not host_allowed(parsed.netloc):
        abort(403)

    headers = {
        "Referer": "https://mangadex.org/",
        "User-Agent": session.headers.get("User-Agent"),
        "Accept": "image/avif,image/webp,image/*,*/*;q=0.8",
        "Accept-Encoding": "identity",
        "Connection": "keep-alive",
    }

    try:
        upstream = session.get(target, headers=headers, timeout=(5, 40), stream=True)
    except requests.exceptions.RequestException:
        abort(502)

    if upstream.status_code != 200:
        abort(upstream.status_code)

    ctype = upstream.headers.get("Content-Type", "image/jpeg")
    cache_headers = {"Cache-Control": "public, max-age=86400, immutable", "Content-Type": ctype}

    def generate():
        try:
            for chunk in upstream.iter_content(64 * 1024):
                if chunk:
                    yield chunk
        finally:
            upstream.close()

    return Response(generate(), headers=cache_headers)

# -------------------------
# Run
# -------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
