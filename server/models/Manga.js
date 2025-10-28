// models/Manga.js
import mongoose from "mongoose";

const MangaSchema = new mongoose.Schema(
    {
        title: String,
        slug: String,
        coverUrl: String,
        author: String,
        artist: String,
        status: { type: String, default: "Ongoing" },
        popularity: { type: Number, default: 0 },
        releaseYear: Number,
        cmsId: String
    },
    { timestamps: true, collection: "mangas" }
);

export default mongoose.models.Manga || mongoose.model("Manga", MangaSchema);
