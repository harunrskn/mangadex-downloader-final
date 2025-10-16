import { Link } from "react-router-dom";
import { useBookmarks } from "../hooks/useLocalBookmarks";

// 🔹 mapping kode bahasa → emoji bendera
const FLAG_MAP = {
  id: "🇮🇩",
  en: "🇬🇧",
  jp: "🇯🇵",
  fr: "🇫🇷",
  es: "🇪🇸",
  de: "🇩🇪",
};

// buat slug aman dari judul
function slugify(s) {
  if (!s) return "manga";
  return (
    s
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "manga"
  );
}

// ubah URL cover Mangadex → proxy backend (/api/img/covers/<mangaId>/<fileName>)
function toProxiedCover(u) {
  if (!u) return "";
  try {
    const m = u.match(
      /uploads\.mangadex\.org\/covers\/([^/]+)\/([^/?#]+)/i
    );
    if (m) {
      const mangaId = m[1];
      const file = m[2];
      return `/api/img/covers/${mangaId}/${file}`;
    }
  } catch {}
  return u;
}

export default function MangaCard({ item }) {
  const { id, title, status, langs = [] } = item;
  const rawCover = item.cover || "";
  const cover = toProxiedCover(rawCover);
  const slug = slugify(title);

  // bookmarks
  const { has, toggle } = useBookmarks();
  const isBk = has(id);

  const handleToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggle({ id, title, cover: rawCover, status });
  };

  const imgProps = {
    alt: title,
    loading: "lazy",
    decoding: "async",
    className:
      "w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300",
    onError: (e) => {
      if (e.currentTarget.dataset.fallbackApplied === "1") return;
      e.currentTarget.dataset.fallbackApplied = "1";
      e.currentTarget.src = "/fallback-cover.jpg";
    },
  };

  return (
    <div className="group rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-brand/40 transition relative">
      {/* Tombol Bookmark */}
      <button
        onClick={handleToggle}
        aria-label={isBk ? "Remove bookmark" : "Add bookmark"}
        className={`absolute right-2 top-2 z-10 rounded-full px-2 py-1 text-xs border ${
          isBk
            ? "bg-brand/30 text-black border-brand/60"
            : "bg-black/30 text-white border-white/20"
        } backdrop-blur`}
        title={isBk ? "Remove bookmark" : "Add bookmark"}
      >
        {isBk ? "★ Saved" : "☆ Save"}
      </button>

      {/* Cover */}
      <Link
        to={`/manga/${id}/${slug}`}
        className="block aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800"
      >
        {cover ? (
          <img src={cover} {...imgProps} />
        ) : (
          <img src="/fallback-cover.jpg" {...imgProps} />
        )}
      </Link>

      {/* Info */}
      <div className="p-3">
        <Link
          to={`/manga/${id}/${slug}`}
          className="font-semibold line-clamp-2 hover:text-brand"
        >
          {title}
        </Link>

        {status && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 uppercase">
            {status}
          </div>
        )}

        {/* 🔹 tampilkan bendera bahasa */}
        {langs.length > 0 && (
          <div className="mt-1 flex gap-1 text-sm">
            {langs.map((l) => (
              <span key={l}>{FLAG_MAP[l] || l.toUpperCase()}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
