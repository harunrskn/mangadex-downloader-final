// src/pages/Genres.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FiltersPanel from "../components/FiltersPanel";
import Empty from "../components/Empty";
import { fetchMangaList } from "../services/api";

export default function Genres() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // default
  const DEFAULT_SORT = "latest";

  // Build opsi fetch dari URL param, memoized supaya dependency effect stabil
  const opts = useMemo(() => {
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "24", 10)));
    return {
      q: searchParams.get("q") || undefined,
      genre: searchParams.get("genre") || undefined,
      status: searchParams.get("status") || undefined,
      type: searchParams.get("type") || undefined,
      letter: searchParams.get("letter") || undefined,
      sort: (searchParams.get("sort") || DEFAULT_SORT).toLowerCase(),
      page,
      limit,
    };
  }, [searchParams]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const { manga, total } = await fetchMangaList(opts);
        if (!alive) return;
        setItems(manga || []);
        setTotal(total ?? 0);
      } catch {
        if (!alive) return;
        setItems([]);
        setTotal(0);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [opts]);

  // Pagination helpers
  const pageCount = Math.max(1, Math.ceil(total / (opts.limit || 24)));
  const goPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next, { replace: false });
    // scroll top biar enak
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-6xl px-3 py-6">
      <FiltersPanel />

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : items.length ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {items.map((m) => (
              <Link
                key={m.id}
                to={`/detail/${encodeURIComponent(m.slug || m.id)}`}
                className="block border rounded-xl overflow-hidden hover:shadow bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
              >
                <img
                  src={m.cover}
                  alt={m.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full aspect-[3/4] object-cover bg-gray-200/20"
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml;charset=UTF-8," +
                      encodeURIComponent(
                        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="#2a2a2a"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#aaa" font-family="sans-serif" font-size="18">No Image</text></svg>'
                      );
                  }}
                />
                <div className="p-2">
                  <div className="text-sm line-clamp-2 font-medium">{m.title}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                className="px-3 py-1.5 rounded-md border disabled:opacity-50"
                onClick={() => goPage(Math.max(1, (opts.page || 1) - 1))}
                disabled={(opts.page || 1) <= 1}
              >
                Prev
              </button>
              <span className="text-sm opacity-80">
                Page <b>{opts.page || 1}</b> of <b>{pageCount}</b>
              </span>
              <button
                className="px-3 py-1.5 rounded-md border disabled:opacity-50"
                onClick={() => goPage(Math.min(pageCount, (opts.page || 1) + 1))}
                disabled={(opts.page || 1) >= pageCount}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <Empty title="Tidak ada hasil" />
      )}
    </div>
  );
}
