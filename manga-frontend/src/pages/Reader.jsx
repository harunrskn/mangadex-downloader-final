import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  Link,
} from "react-router-dom";
import {
  fetchChapter,
  fetchChapters,
  fetchMangaDetail,
  fetchRecommended,
} from "../services/api";
import ReaderToolbar from "../components/ReaderToolbar";
import { useReaderPrefs } from "../hooks/useReaderPrefs";

const slugify = (s) =>
  (s || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "manga";

export default function Reader() {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const chapterId = params.chapterId || searchParams.get("ch");
  const seriesKey = params.slug || params.slugOrId || null;

  const { prefs, set } = useReaderPrefs();

  const [chapter, setChapter] = useState(null);
  const [chapterList, setChapterList] = useState([]);
  const [images, setImages] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [rec, setRec] = useState([]);
  const [error, setError] = useState("");

  const imgRefs = useRef([]);
  const ioRef = useRef(null);
  const topAnchorRef = useRef(null);
  const lastManualJumpRef = useRef(0);

  const useProxy = (import.meta.env.VITE_IMG_PROXY || "0") === "1";
  const proxify = (url) =>
    useProxy ? `/api/img/relay?u=${encodeURIComponent(url)}` : url;

  useEffect(() => {
    let live = true;

    async function load() {
      if (!chapterId) return;

      setError("");
      setChapter(null);
      setImages([]);
      setPageIndex(0);
      imgRefs.current = [];
      window.scrollTo({ top: 0, behavior: "instant" });

      try {
        const ch = await fetchChapter(chapterId);
        if (!live) return;

        setChapter(ch || null);
        const raw = Array.isArray(ch?.pages) ? ch.pages : [];
        setImages(raw);
      } catch (e) {
        if (!live) return;
        setError(e?.message || "Gagal memuat chapter.");
        setImages([]);
        setChapterList([]);
        setRec([]);
        return;
      }

      if (seriesKey) {
        try {
          const listResp = await fetchChapters(seriesKey, {
            sort: "asc",
            page: 1,
            limit: 5000,
          });
          if (!live) return;
          setChapterList(
            Array.isArray(listResp?.chapters) ? listResp.chapters : []
          );
        } catch {
          if (!live) return;
          setChapterList([]);
        }

        try {
          const detail = await fetchMangaDetail(seriesKey);
          const baseGenres = Array.isArray(detail?.genres)
            ? detail.genres
            : [];
          const r = await fetchRecommended(baseGenres, 12);
          if (!live) return;
          setRec(Array.isArray(r) ? r : []);
        } catch {
          if (!live) return;
          setRec([]);
        }
      } else {
        setChapterList([]);
        setRec([]);
      }
    }

    load();
    return () => {
      live = false;
      if (ioRef.current) {
        ioRef.current.disconnect();
        ioRef.current = null;
      }
    };
  }, [seriesKey, chapterId]);

  const currentIndex = useMemo(() => {
    if (!chapterList.length) return -1;
    const curId = String(chapter?.id || chapterId || "");
    let idx = chapterList.findIndex((c) => String(c.id) === curId);
    if (idx !== -1) return idx;
    if (chapter?.seq != null) {
      idx = chapterList.findIndex((c) => c.seq === chapter.seq);
    }
    return idx;
  }, [chapterList, chapter, chapterId]);

  const hasPrevChapter = currentIndex > 0;
  const hasNextChapter =
    currentIndex >= 0 && currentIndex < chapterList.length - 1;

  const goPrevChapter = useCallback(() => {
    if (!hasPrevChapter) return;
    const prev = chapterList[currentIndex - 1];
    const cid = encodeURIComponent(prev.id);
    if (seriesKey) navigate(`/reader/${encodeURIComponent(seriesKey)}/${cid}`);
    else navigate(`/reader/${cid}`);
    window.scrollTo({ top: 0, behavior: "instant" });
    setPageIndex(0);
  }, [hasPrevChapter, chapterList, currentIndex, navigate, seriesKey]);

  const goNextChapter = useCallback(() => {
    if (!hasNextChapter) return;
    const nxt = chapterList[currentIndex + 1];
    const cid = encodeURIComponent(nxt.id);
    if (seriesKey) navigate(`/reader/${encodeURIComponent(seriesKey)}/${cid}`);
    else navigate(`/reader/${cid}`);
    window.scrollTo({ top: 0, behavior: "instant" });
    setPageIndex(0);
  }, [hasNextChapter, chapterList, currentIndex, navigate, seriesKey]);

  const displayImages = useMemo(() => images.map(proxify), [images, useProxy]);

  const renderToolbar = (pos) => (
    <ReaderToolbar
      pageIndex={pageIndex}
      totalPages={displayImages.length}
      onPrevPage={() => setPageIndex((p) => Math.max(0, p - 1))}
      onNextPage={() =>
        setPageIndex((p) => Math.min(images.length - 1, p + 1))
      }
      onJumpPage={(i) => setPageIndex(i)}
      chapterIndex={currentIndex >= 0 ? currentIndex : 0}
      chapterTotal={chapterList.length}
      hasPrevChapter={hasPrevChapter}
      hasNextChapter={hasNextChapter}
      onPrevChapter={goPrevChapter}
      onNextChapter={goNextChapter}
      fit={prefs.fit}
      onChangeFit={(v) => set({ fit: v })}
      zoom={prefs.zoom}
      onZoomIn={() =>
        set({ zoom: Math.min(3, Math.round((prefs.zoom + 0.1) * 10) / 10) })
      }
      onZoomOut={() =>
        set({ zoom: Math.max(0.5, Math.round((prefs.zoom - 0.1) * 10) / 10) })
      }
      direction={prefs.direction}
      onToggleDirection={() =>
        set({ direction: prefs.direction === "rtl" ? "ltr" : "rtl" })
      }
      chapterTitle={
        chapter?.seq != null ? `Chapter ${chapter.seq}` : chapter?.title
      }
      position={pos}
    />
  );

  return (
    <div className="mx-auto max-w-5xl px-3 pb-16">
      <div ref={topAnchorRef} />
      {renderToolbar("top")}

      {!!error && (
        <div className="my-3 p-3 rounded-md border border-red-300/50 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div
        className="mt-4"
        style={{ direction: prefs.direction === "rtl" ? "rtl" : "ltr" }}
      >
        {displayImages.map((src, i) => (
          <img
            ref={(el) => (imgRefs.current[i] = el)}
            key={`${i}-${src}`}
            data-index={i}
            src={src}
            alt={`Page ${i + 1}`}
            loading="lazy"
            decoding="async"
            style={{
              width: prefs.fit === "width" ? "100%" : "auto",
              height: prefs.fit === "height" ? "80vh" : "auto",
              objectFit: "contain",
              transform: `scale(${prefs.zoom})`,
              transformOrigin: "center center",
              borderRadius: "12px",
              display: "block",
              margin: "12px auto",
            }}
          />
        ))}
      </div>

      <div className="mt-6">{renderToolbar("bottom")}</div>

      {rec?.length ? (
        <div className="mt-10">
          <h3 className="font-semibold mb-3">Rekomendasi untukmu</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {rec.map((m) => {
              const target = encodeURIComponent(m.slug || m.id);
              const cosmetic = slugify(m.title);
              return (
                <Link
                  key={m.id || cosmetic}
                  to={`/detail/${target}`}
                  className="block border rounded-xl overflow-hidden hover:shadow bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                >
                  <img
                    src={m.cover}
                    alt={m.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full aspect-[3/4] object-cover bg-gray-200/20"
                  />
                  <div className="p-2 text-sm line-clamp-2">{m.title}</div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
