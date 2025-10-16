import React from "react";

export default function ReaderToolbar({
  // page
  pageIndex,
  totalPages,
  onPrevPage,
  onNextPage,
  onJumpPage,

  // chapter
  chapterIndex,
  chapterTotal,
  hasPrevChapter,
  hasNextChapter,
  onPrevChapter,
  onNextChapter,
  onJumpChapter,

  // prefs
  fit,
  onChangeFit,
  zoom,
  onZoomIn,
  onZoomOut,
  direction,
  onToggleDirection,

  // info
  chapterTitle,
  position = "top",
}) {
  return (
    <div
      className={`sticky ${position === "top" ? "top-0" : "bottom-0"
        } z-20 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-y border-gray-200 dark:border-gray-800`}
    >
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
        {/* --- CHAPTER NAV --- */}
        <div className="flex items-center gap-1">
          <button
            disabled={!hasPrevChapter}
            onClick={onPrevChapter}
            className="px-2 py-1 rounded border disabled:opacity-50"
          >
            ◀ Prev
          </button>

          <select
            value={chapterIndex}
            onChange={(e) => onJumpChapter(parseInt(e.target.value, 10))}
            className="px-2 py-1 rounded border bg-transparent"
          >
            {Array.from({ length: chapterTotal }, (_, i) => (
              <option key={i} value={i}>
                Chapter {i + 1}
              </option>
            ))}
          </select>

          <button
            disabled={!hasNextChapter}
            onClick={onNextChapter}
            className="px-2 py-1 rounded border disabled:opacity-50"
          >
            Next ▶
          </button>
        </div>

        {/* --- PAGE NAV --- */}
        <div className="flex items-center gap-1 ml-4">
          <button
            disabled={pageIndex <= 0}
            onClick={onPrevPage}
            className="px-2 py-1 rounded border disabled:opacity-50"
          >
            ← Page
          </button>
          <span>
            {pageIndex + 1} / {totalPages}
          </span>
          <button
            disabled={pageIndex >= totalPages - 1}
            onClick={onNextPage}
            className="px-2 py-1 rounded border disabled:opacity-50"
          >
            Page →
          </button>
        </div>

        {/* --- VIEW PREFS --- */}
        <div className="flex items-center gap-1 ml-4">
          <select
            value={fit}
            onChange={(e) => onChangeFit(e.target.value)}
            className="px-2 py-1 rounded border bg-transparent"
          >
            <option value="width">Fit Width</option>
            <option value="height">Fit Height</option>
            <option value="none">Original</option>
          </select>

          <button
            onClick={onZoomOut}
            className="px-2 py-1 rounded border"
            title="Zoom Out"
          >
            -
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            onClick={onZoomIn}
            className="px-2 py-1 rounded border"
            title="Zoom In"
          >
            +
          </button>

          <button
            onClick={onToggleDirection}
            className="px-2 py-1 rounded border"
            title="Toggle arah baca"
          >
            {direction === "rtl" ? "R→L" : "L→R"}
          </button>
        </div>

        {/* --- INFO --- */}
        <div className="ml-auto font-medium truncate max-w-[200px]">
          {chapterTitle || "—"}
        </div>
      </div>
    </div>
  );
}
