# MocoManga Frontend (Vite + React + Tailwind)

Modern manga UI (inspired by kiryuu02 style) wired to your local API.

## Quick Start

1) Ensure your Flask API is running locally (defaults to `http://localhost:5000`) and exposes:
   - `GET /api/manga?limit&offset`
   - `GET /api/manga/:title`
   - `GET /api/manga/:manga_id/chapters`
   - `GET /api/chapter/:chapter_id`

2) Install deps and run:
```bash
npm install
npm run dev
```

By default, the Vite dev server proxies `/api` → `http://localhost:5000` to avoid CORS issues.
To override the API base, create a `.env` file with:
```
VITE_API_BASE=http://localhost:5000
```

## Build
```bash
npm run build
npm run preview
```

## Notes
- Home shows a paginated grid of manga covers from `/api/manga`.
- Clicking a card opens the Chapters list.
- Reader constructs image URLs using MangaDex at-home server response.
- Simple search via the top bar: it hits `/api/manga/:title` and shows the first match.
