// index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import mangaRouter from "./routes/manga.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===== Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// ===== Static (jika kamu pakai upload lokal)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== DB (opsional)
await connectDB(process.env.MONGODB_URI);

// ===== Health
app.get("/", (_req, res) => res.json({ ok: true, message: "Node Proxy + CMS running 🚀" }));

// ===== API (manga)
app.use("/api/manga", mangaRouter);

// (opsional) CMS routes kamu — aman bila tidak ada
for (const [url, mod] of [
    ["/cms/auth", "./routes/auth.routes.js"],
    ["/cms/genre", "./routes/genre.routes.js"],
    ["/cms/manga", "./routes/manga.cms.routes.js"],
    ["/cms/chapter", "./routes/chapter.routes.js"],
    ["/cms/upload", "./routes/upload.routes.js"],
]) {
    try {
        const r = (await import(mod)).default;
        if (r) app.use(url, r);
    } catch {
        /* skip jika file tidak ada */
    }
}

// ===== 404
app.use((_req, res) => res.status(404).json({ message: "Not found" }));

// ===== Start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
