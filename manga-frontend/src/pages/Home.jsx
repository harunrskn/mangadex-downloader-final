import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { fetchMangaList } from "../services/api";
import MangaCard from "../components/MangaCard";
import SkeletonCard from "../components/SkeletonCard";
import { getReadingContext } from "../hooks/useReadingContext";
import HeroCarousel from "../components/HeroCarousel";

const TABS = [
  { key: "latest", label: "Latest" },
  { key: "popular", label: "Popular" },
  { key: "genres", label: "Genres" },
];

const DEFAULT_LIMIT = 24;

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const qParam = searchParams.get("q") || "";
  const tabParam = searchParams.get("tab") || "latest";
  const genreParam = searchParams.get("genre") || "";

  const [tab, setTab] = useState(tabParam);
  const [genre, setGenre] = useState(genreParam);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sentinelRef = useRef(null);

  const effectiveSort = useMemo(
    () => (tab === "popular" ? "popular" : "latest"),
    [tab]
  );
  const effectiveGenre = useMemo(
    () => (tab === "genres" ? genre : undefined),
    [tab, genre]
  );

  const canLoadMore = items.length < total;

  const doFetch = useCallback(
    async (targetPage) => {
      setLoading(true);
      setError("");
      try {
        const { manga, total } = await fetchMangaList({
          q: qParam || undefined,
          sort: effectiveSort,
          genre: effectiveGenre,
          page: targetPage,
          limit: DEFAULT_LIMIT,
        });
        setTotal(total || 0);
        if (targetPage === 1) setItems(manga || []);
        else setItems((prev) => [...prev, ...(manga || [])]);
      } catch (e) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    },
    [qParam, effectiveSort, effectiveGenre]
  );

  // Reset ketika query/tab/genre berubah
  useEffect(() => {
    setItems([]);
    setPage(1);
    setTotal(0);
    doFetch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam, effectiveSort, effectiveGenre]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !loading && canLoadMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          doFetch(nextPage);
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [page, loading, canLoadMore, doFetch]);

  // Sinkron URL dengan tab & genre
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    if (tab === "genres" && genre) next.set("genre", genre);
    else next.delete("genre");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, genre]);

  // Ambil opsi genre dari hasil saat ini
  const genreOptions = useMemo(() => {
    const set = new Set();
    items.forEach((m) =>
      (m.genres || m.genre || []).forEach((g) => set.add(String(g)))
    );
    return Array.from(set).sort();
  }, [items]);

  // Continue Reading (local)
  const rc = getReadingContext();

  return (
    <section className="mx-auto max-w-7xl px-3 py-6">
      {/* Hero Carousel */}
      {!loading && items.length > 0 && <HeroCarousel items={items.slice(0, 6)} />}

      {/* Continue Reading */}
      {rc && rc.chapters && rc.chapters.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs opacity-70 mb-1">Continue Reading</div>
            <div className="text-lg font-semibold">{rc.title || "Recent manga"}</div>
            <div className="text-sm opacity-70">
              Last: Chapter {rc.chapters[rc.index]}
            </div>
          </div>
          <button
            onClick={() =>
              navigate(`/reader/${encodeURIComponent(rc.chapters[rc.index])}`)
            }
            className="px-4 py-2 rounded-xl border border-brand/50 bg-brand/20 text-brand hover:bg-brand/30"
          >
            Continue
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold">Discover</h1>

        <div className="flex items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 rounded-xl border text-sm ${tab === t.key
                  ? "border-brand text-brand bg-brand/10"
                  : "border-gray-300 dark:border-gray-700 hover:border-brand/50"
                }`}
            >
              {t.label}
            </button>
          ))}

          {tab === "genres" && (
            <>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
              >
                <option value="">All genres</option>
                {genreOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <Link
                to={`/genres?genre=${encodeURIComponent(genre || "")}`}
                className="text-sm underline opacity-80"
              >
                open page
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Error kecil */}
      {!!error && (
        <div className="mb-4 p-3 rounded-md border border-red-300/50 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading && items.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: DEFAULT_LIMIT }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((m) => {
            const key = m?.id || m?.slug;
            if (!key) return null;
            return (
              <Link key={key} to={`/detail/${encodeURIComponent(key)}`}>
                <MangaCard item={m} />
              </Link>
            );
          })}
        </div>
      )}

      {/* Sentinel */}
      <div ref={sentinelRef} className="h-12" />

      {loading && items.length > 0 && (
        <div className="text-center py-4 text-sm opacity-70">Loading more…</div>
      )}
      {!loading && items.length > 0 && items.length >= total && (
        <div className="text-center py-4 text-sm opacity-60">
          You’ve reached the end.
        </div>
      )}
    </section>
  );
}
