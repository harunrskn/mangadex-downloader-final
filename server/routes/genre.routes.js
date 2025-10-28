const router = require("express").Router();
const Genre = require("../models/Genre");
const { auth } = require("../middlewares/auth");

router.get("/", async (_req, res) => {
    const items = await Genre.find().sort({ name: 1 });
    res.json(items);
});

router.post("/", auth, async (req, res) => {
    const { name, description } = req.body || {};
    if (!name) return res.status(400).json({ message: "name required" });
    const created = await Genre.create({ name, description });
    res.json(created);
});

router.put("/:id", auth, async (req, res) => {
    const updated = await Genre.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
});

router.delete("/:id", auth, async (req, res) => {
    await Genre.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
});

module.exports = router;
