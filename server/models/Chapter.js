const mongoose = require("mongoose");
const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 12);

const chapterSchema = new mongoose.Schema({
    manga: { type: mongoose.Schema.Types.ObjectId, ref: "Manga", required: true },
    chapterNo: { type: Number, required: true },
    title: { type: String },
    releaseDate: { type: Date, default: () => new Date() },
    // Simpan array URL halaman (served by Node /uploads/pages/..)
    pages: [{ type: String, required: true }],
    cmsChapterId: { type: String, default: () => nanoid(), index: true }
}, { timestamps: true });

chapterSchema.index({ manga: 1, chapterNo: 1 }, { unique: true });

module.exports = mongoose.model("Chapter", chapterSchema);
