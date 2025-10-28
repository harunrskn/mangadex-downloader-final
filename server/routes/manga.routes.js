// routes/manga.routes.js
import express from "express";
import Manga from "../models/Manga.js";
import { mdFeed, mdDetail, mdChapters, mdPages } from "../utils/mangadex.client.js";

const router = express.Router();

/**
 * GET /api/manga?sort=latest|popular&page=1&limit=24
 * Merge CMS (opsional) + Flask
 */
router.get("/", async (req, res) => {
    try {
        const { page = 1, limit = 24 } = req.query;

        // 1) Flask (Mangadex)
        const fromFlask = await mdFeed(req.query);
        const flaskItems = fromFlask.items || [];

        // 2) CMS (Mongo) – opsional (kalau Model tidak tersedia/koneksi fail, skip)
        let cmsItems = [];
        try {
            if (Manga?.find) {
                const raw = await Manga.find({})
                    .sort({ createdAt: -1 })
                    .skip((Number(page) - 1) * Number(limit))
                    .limit(Number(limit))
                    .lean();

                cmsItems = raw.map((m) => ({
                    id: m.cmsId || String(m._id),
                    source: "cms",
                    title: m.title,
                    slug: m.slug || m.title?.toLowerCase().replace(/\s+/g, "-"),
                    cover:
                        m.coverUrl && m.coverUrl.startsWith("http")
                            ? m.coverUrl
                            : m.coverUrl
                                ? `${process.env.BASE_URL || "http://localhost:4000"}${m.coverUrl}`
                                : "https://placehold.co/300x400?text=No+Cover",
                    status: m.status || "Ongoing",
                    popularity: m.popularity || 0,
                    release_year: m.releaseYear || null,
                    createdAt: m.createdAt,
                }));
            }
        } catch (e) {
            // skip bila DB down
            cmsItems = [];
        }

        res.json({
            ok: true,
            items: [...cmsItems, ...flaskItems.map((f) => ({ ...f, source: "md" }))],
            page: Number(fromFlask.page || page),
            limit: Number(fromFlask.limit || limit),
            total: fromFlask.total ?? flaskItems.length,
            cmsCount: cmsItems.length,
            flaskCount: flaskItems.length,
        });
    } catch (e) {
        console.error("❌ /api/manga error:", e.message);
        res.status(500).json({ ok: false, message: e.message || "merge error" });
    }
});

/** GET /api/manga/:id (detail) */
router.get("/:id", async (req, res) => {
    try {
        const data = await mdDetail(req.params.id);
        res.json(data);
    } catch (e) {
        res.status(500).json({ ok: false, message: "detail error" });
    }
});

/** GET /api/manga/:id/chapters */
router.get("/:id/chapters", async (req, res) => {
    try {
        const data = await mdChapters(req.params.id, req.query);
        res.json(data);
    } catch (e) {
        res.status(500).json({ ok: false, message: "chapters error" });
    }
});

/** GET /api/manga/chapter/:chapterId/pages  (endpoint baru) */
router.get("/chapter/:chapterId/pages", async (req, res) => {
    try {
        const data = await mdPages(req.params.chapterId);
        res.json(data);
    } catch (e) {
        res.status(500).json({ ok: false, message: "pages error" });
    }
});

/** 🔙 Kompatibilitas: GET /api/manga/:chapterId/pages  (endpoint lama FE) */
router.get("/:chapterId/pages", async (req, res) => {
    try {
        const data = await mdPages(req.params.chapterId);
        res.json(data);
    } catch (e) {
        res.status(500).json({ ok: false, message: "pages error (legacy)" });
    }
});

export default router;
