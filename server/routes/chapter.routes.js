const router = require("express").Router();
const Chapter = require("../models/Chapter");
const Manga = require("../models/Manga");
const { auth } = require("../middlewares/auth");

router.get("/:mangaSlug", async (req, res) => {
    const manga = await Manga.findOne({ slug: req.params.mangaSlug });
    if (!manga) return res.status(404).json({ message: "Manga not found" });
    const chapters = await Chapter.find({ manga: manga._id }).sort({ chapterNo: -1 });
    res.json({ manga: { id: manga._id, title: manga.title, slug: manga.slug }, chapters });
});

router.post("/:mangaSlug", auth, async (req, res) => {
    const manga = await Manga.findOne({ slug: req.params.mangaSlug });
    if (!manga) return res.status(404).json({ message: "Manga not found" });

    const { chapterNo, title, pages = [] } = req.body || {};
    if (!chapterNo || !Array.isArray(pages) || pages.length === 0)
        return res.status(400).json({ message: "chapterNo & pages[] required" });

    const created = await Chapter.create({
        manga: manga._id,
        chapterNo: +chapterNo,
        title,
        pages,
    });
    res.json(created);
});

router.delete("/:id", auth, async (req, res) => {
    await Chapter.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
});

module.exports = router;
