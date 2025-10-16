// src/services/api.js
import axios from "axios";

const RAW_BASE = (import.meta.env.VITE_API_BASE || "").trim();
const API_BASE = RAW_BASE.replace(/\/+$/, "");

function apiPath(p) {
  const clean = p.startsWith("/") ? p : `/${p}`;
  const pathHasApi = /^\/api(\/|$)/i.test(clean);
  const baseHasApi = /\/api$/i.test(API_BASE);
  if (pathHasApi) return clean;
  if (baseHasApi) return clean;
  return `/api${clean}`;
}

const client = axios.create({
  baseURL: API_BASE,
  headers: { Accept: "application/json" },
  timeout: 20000,
});

const normItem = (m) => ({
  id: m.id || m._id || m.slug || m.slugId,
  slug: m.slug || m.id || m._id,
  title: m.title || m.name,
  cover: m.cover || m.thumbnail || m.image,
  status: String(m.status || "").toLowerCase(),
  type: (m.type || m.format || "").toLowerCase(),
  genres: m.genres || m.tags || m.genre || [],
  updatedAt: m.updatedAt || m.last_update || m.lastUpdated,
  popularity: m.popularity || m.views || 0,
});

export async function fetchMangaList(opts = {}) {
  const {
    q, genre, status, letter,
    sort = "latest",
    page, offset,
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

  let list = Array.isArray(data?.manga) ? data.manga.map(normItem) : [];

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

export async function fetchMangaDetail(id) {
  const { data } = await client.get(apiPath(`/manga/${encodeURIComponent(id)}`));
  return data || {};
}

/**
 * Ambil daftar chapter:
 * - Backend sudah kasih field seq (urutan fix 1..N).
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
      number: c.seq ?? null, // ⚡ pakai seq, bukan MangaDex chapter raw
      seq: c.seq ?? i + 1,   // backup numbering kalau seq ga ada
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

export async function fetchChapter(chapterId) {
  const { data } = await client.get(apiPath(`/chapter/${encodeURIComponent(chapterId)}`), {
    params: { quality: "auto" },
  });

  // Backend mengembalikan { pages: [{url}], total, chapterId, quality }
  // → Normalisasi ke array string URL biar Reader.jsx bisa langsung map
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
