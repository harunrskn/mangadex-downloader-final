// utils/mangadex.client.js
import axios from "axios";

const FLASK_API = process.env.FLASK_API || "http://127.0.0.1:5000/api";

// Helper GET dengan error handling singkat
async function g(path, params) {
  const url = `${FLASK_API}${path}`;
  const { data } = await axios.get(url, { params, timeout: 20000 });
  return data;
}

/** FEED (latest/popular) dari Flask (Mangadex) */
export async function mdFeed(query) {
  // Flask menerima /manga?sort=latest|popular&page=...&limit=...
  const data = await g("/manga", query);
  // Normalisasi: Flask mengembalikan {limit, page, manga:[]}
  const items = Array.isArray(data?.manga) ? data.manga : (data?.items || []);
  // Pastikan cover absolute URL (hindari /api/api/img...)
  const fixed = items.map((m) => ({
    ...m,
    cover:
      typeof m.cover === "string"
        ? m.cover.startsWith("http")
          ? m.cover
          : m.cover.startsWith("/api/")
          ? `${FLASK_API}${m.cover}` // sekali prefix saja
          : `${FLASK_API}/api${m.cover.startsWith("/") ? "" : "/"}${m.cover}`
        : null,
  }));
  return {
    items: fixed,
    page: Number(query?.page || data?.page || 1),
    limit: Number(query?.limit || data?.limit || fixed.length || 24),
    total: data?.total ?? fixed.length,
  };
}

/** DETAIL MANGA */
export async function mdDetail(id) {
  const d = await g(`/manga/${id}`);
  // Samakan cover
  const cover =
    typeof d?.manga?.cover === "string"
      ? d.manga.cover.startsWith("http")
        ? d.manga.cover
        : `${FLASK_API}${d.manga.cover}`
      : null;
  return { ...d, manga: { ...(d?.manga || {}), cover } };
}

/** DAFTAR CHAPTER */
export async function mdChapters(id, params) {
  const d = await g(`/manga/${id}/chapters`, params);
  return d; // sudah rapi dari Flask
}

/** HALAMAN (IMAGES) CHAPTER */
export async function mdPages(chapterId) {
  const d = await g(`/manga/${chapterId}/pages`);
  // Pastikan setiap URL absolute (Flask biasanya sudah absolute)
  const pages = Array.isArray(d?.pages)
    ? d.pages.map((u) =>
        typeof u === "string" && u.startsWith("http") ? u : `${FLASK_API}${u}`
      )
    : [];
  return { ...d, pages };
}
