const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { auth } = require("../middlewares/auth");

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

const coversDir = path.join(__dirname, "..", "uploads", "covers");
const pagesDir = path.join(__dirname, "..", "uploads", "pages");
ensureDir(coversDir); ensureDir(pagesDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "cover") cb(null, coversDir);
        else cb(null, pagesDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext).replace(/\s+/g, "-").toLowerCase();
        cb(null, `${Date.now()}-${base}${ext}`);
    }
});
const upload = multer({ storage });

router.post("/cover", auth, upload.single("cover"), (req, res) => {
    const rel = `/uploads/covers/${req.file.filename}`;
    res.json({ url: rel });
});

router.post("/pages", auth, upload.array("pages", 100), (req, res) => {
    const files = (req.files || []).map(f => `/uploads/pages/${f.filename}`);
    res.json({ urls: files });
});

module.exports = router;
