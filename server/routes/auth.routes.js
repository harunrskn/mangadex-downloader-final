const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// seed admin jika belum ada
router.post("/seed-admin", async (req, res) => {
    const { username = "admin", password = "admin123" } = req.body || {};
    const exists = await User.findOne({ username });
    if (exists) return res.json({ ok: true, message: "Admin already exists" });
    await User.create({ username, password, role: "admin" });
    res.json({ ok: true, message: "Admin created", username });
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ message: "username & password required" });
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await user.compare(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
});

module.exports = router;
