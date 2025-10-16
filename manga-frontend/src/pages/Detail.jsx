import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchMangaDetail, fetchChapters } from "../services/api";

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [series, setSeries] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [block, setBlock] = useState(0);

  const prefsKey = `reader_dir_${id}`;
  const [readingDirection, setReadingDirection] = useState(() => {
    if (typeof window === "undefined") return "rtl";
    return localStorage.getItem(prefsKey) || "rtl";
  });

  const toggleReadingDirection = () => {
    setReadingDirection((prev) => {
      const next = prev === "rtl" ? "ltr" : "rtl";
      localStorage.setItem(prefsKey, next);
      return next;
    });
  };

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      try {
        const s = await fetchMangaDetail(id);
        if (!alive) return;
        setSeries(s);

        const list = await fetchChapters(id, {
          sort: "asc",
          page: 1,
          limit: 5000,
        });
        if (!alive) return;
        setChapters(list?.chapters || []);
        setBlock(0);
      } catch (e) {
        console.error("Error fetch detail:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const blocks = useMemo(() => {
    const size = 50;
    const out = [];
    for (let i = 0; i < chapters.length; i += size) {
      out.push(chapters.slice(i, i + size));
    }
    return out;
  }, [chapters]);

  const firstChapter = chapters?.[0];
  const lastChapter = chapters?.[chapters.length - 1];
  const seriesKeyForUrl = encodeURIComponent(series?.id || id);

  return (
    <div className="mx-auto max-w-5xl px-3 py-6">
      {series ? (
        <div className="flex gap-4">
          <img
            src={series.cover}
            alt={series.title}
            className="w-32 h-44 object-cover rounded-xl bg-gray-200/10"
            loading="lazy"
            decoding="async"
          />
          <div>
            <h1 className="text-2xl font-semibold">{series.title}</h1>
            <p className="opacity-80 mt-2 line-clamp-4">
              {series.synopsis || series.description || "—"}
            </p>

            <div className="mt-3 text-sm opacity-80 space-y-1">
              <div>
                <b>Arah Baca:</b>{" "}
                {readingDirection === "rtl" ? "Kanan→Kiri" : "Kiri→Kanan"}
              </div>
              <div>
                <b>Status:</b> {series.status || "—"}
              </div>
              <div>
                <b>Genres:</b> {(series.genres || []).join(", ") || "—"}
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              {firstChapter && (
                <button
                  className="px-3 py-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-white/5"
                  onClick={() =>
                    navigate(
                      `/reader/${seriesKeyForUrl}/${encodeURIComponent(
                        firstChapter.id
                      )}`
                    )
                  }
                >
                  Mulai dari Awal
                </button>
              )}
              {lastChapter && (
                <button
                  className="px-3 py-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-white/5"
                  onClick={() =>
                    navigate(
                      `/reader/${seriesKeyForUrl}/${encodeURIComponent(
                        lastChapter.id
                      )}`
                    )
                  }
                >
                  Ke Terbaru
                </button>
              )}
              <button
                className="px-3 py-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-white/5"
                onClick={toggleReadingDirection}
                title="Toggle arah baca"
              >
                Toggle Arah ({readingDirection === "rtl" ? "R→L" : "L→R"})
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4">Loading…</div>
      )}

      {/* Daftar Chapter */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Daftar Chapter</h2>
          {blocks.length > 1 && (
            <select
              className="px-2 py-1 rounded-lg border bg-transparent"
              value={block}
              onChange={(e) => setBlock(parseInt(e.target.value, 10))}
            >
              {blocks.map((_, i) => {
                const start = i * 50 + 1;
                const end = Math.min((i + 1) * 50, chapters.length);
                return (
                  <option value={i} key={i}>
                    {start} – {end}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 divide-y border rounded-xl">
          {(blocks[block] || []).map((c) => {
            const title = c.seq
              ? `Chapter ${c.seq}`
              : c.number
                ? `Chapter ${c.number}`
                : c.title || "Chapter";
            const dateStr = c.releaseDate
              ? new Date(c.releaseDate).toLocaleDateString()
              : "—";
            return (
              <button
                key={c.id}
                onClick={() =>
                  navigate(
                    `/reader/${seriesKeyForUrl}/${encodeURIComponent(c.id)}`
                  )
                }
                className="text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{title}</span>
                  <span className="opacity-70 text-sm">{dateStr}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
