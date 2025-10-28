// src/services/api.js
import axios from "axios";

// Ambil base URL dari environment (atau fallback ke localhost:4000)
const RAW_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:4000").trim();
const API_BASE = RAW_BASE.replace(/\/+$/, "");

// Utility untuk memastikan path API benar
function apiPath(p) {
  const clean = p.startsWith("/") ? p : `/${p}`;
  const pathHasApi = /^\/api(\/|$)/i.test(clean);
  const baseHasApi = /\/api$/i.test(API_BASE);
  if (pathHasApi) return clean;
  if (baseHasApi) return clean;
  return `/api${clean}`;
}

// Axios client
const client = axios.create({
  baseURL: API_BASE,
  headers: { Accept: "application/json" },
  timeout: 20000,
});

// Normalisasi item manga agar kompatibel di seluruh UI
const normItem = (m) => ({
  id: m.id || m._id || m.slug || m.slugId,
  slug: m.slug || m.id || m._id,
  title: m.title || m.name,
  cover:
    m.cover ||
    m.cover_url ||
    m.thumbnail ||
    m.image ||
    m.coverUrl ||
    "https://placehold.co/300x400?text=No+Cover",
  status: String(m.status || "").toLowerCase(),
  type: (m.type || m.format || "").toLowerCase(),
  genres: m.genres || m.tags || m.genre || [],
  updatedAt: m.updatedAt || m.last_update || m.lastUpdated,
  popularity: m.popularity || m.views || 0,
});

// ✅ Perbaikan utama: ambil `data.items` dari backend CMS/Flask
export async function fetchMangaList(opts = {}) {
  const {
    q,
    genre,
    status,
    letter,
    sort = "latest",
    page,
    offset,
    limit = 24,
    type,
  } = opts;

  const effectivePage =
    typeof page === "number" && page > 0
      ? page
      : typeof offset === "number"
        ? Math.floor(Math.max(0, offset) / Math.max(1, limit)) + 1
        : 1;

  const params = { q, genre, status, letter, sort, page: effectivePage, limit, type };

  const { data } = await client.get(apiPath("/manga"), { params });

  // Ambil dari items (CMS/Flask) atau fallback ke manga lama
  const rawList = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.manga)
      ? data.manga
      : [];

  // Normalisasi ke bentuk MangaCard frontend
  let list = rawList.map(normItem);

  // Filter tambahan
  if (type) list = list.filter((x) => (x.type || "") === String(type).toLowerCase());
  if (status) list = list.filter((x) => (x.status || "") === String(status).toLowerCase());
  if (letter)
    list = list.filter((x) =>
      String(x.title || "").toUpperCase().startsWith(String(letter).toUpperCase())
    );

  return {
    manga: list,
    total: data?.total ?? list.length,
    page: data?.page ?? effectivePage,
  };
}

// Ambil detail manga (CMS/Flask)
export async function fetchMangaDetail(id) {
  const { data } = await client.get(apiPath(`/manga/${encodeURIComponent(id)}`));
  return data || {};
}

/**
 * Ambil daftar chapter:
 * - Backend sudah kasih field seq (urutan fix 1..N)
 * - Jadi kita normalisasi supaya frontend konsisten pakai seq.
 */
export async function fetchChapters(id, opts = {}) {
  const { sort = "asc", page = 1, limit = 5000, translatedLanguage } = opts;

  const params = { sort, page, limit };
  if (translatedLanguage) params.translatedLanguage = translatedLanguage;

  const { data } = await client.get(
    apiPath(`/manga/${encodeURIComponent(id)}/chapters`),
    { params }
  );

  const chapters = Array.isArray(data?.chapters)
    ? data.chapters.map((c, i) => ({
      id: c.id,
      title: c.title || (c.seq ? `Chapter ${c.seq}` : "Chapter"),
      number: c.seq ?? null,
      seq: c.seq ?? i + 1,
      releaseDate: c.releaseDate || null,
      lang: c.lang || null,
    }))
    : [];

  return {
    chapters,
    total: chapters.length,
    page: data?.page ?? page,
  };
}

// Ambil isi chapter (gambar)
export async function fetchChapter(chapterId) {
  const { data } = await client.get(apiPath(`/chapter/${encodeURIComponent(chapterId)}`), {
    params: { quality: "auto" },
  });

  const pages = Array.isArray(data?.pages)
    ? data.pages.map((p) => (typeof p === "string" ? p : p.url))
    : [];

  return {
    id: data?.chapterId || chapterId,
    pages,
    total: pages.length,
    quality: data?.quality || "auto",
  };
}

// Rekomendasi (genre-based)
export async function fetchRecommended(baseGenres = [], take = 12) {
  try {
    const { manga } = await fetchMangaList({
      genre: baseGenres?.[0],
      sort: "popular",
      limit: take,
      page: 1,
    });
    return manga;
  } catch {
    return [];
  }
}
