// config/db.js
import mongoose from "mongoose";

export default async function connectDB(uri) {
    if (!uri) {
        console.warn("ℹ️  MONGODB_URI tidak diset. Melewati koneksi MongoDB.");
        return null;
    }
    try {
        const conn = await mongoose.connect(uri, {
            // opsi modern; useNewUrlParser/useUnifiedTopology sudah deprecated
            dbName: uri.split("/").pop().split("?")[0] || "moco"
        });
        console.log("✅ MongoDB connected");
        return conn;
    } catch (err) {
        console.error("❌ MongoDB ERROR:", err.message);
        // Jangan matikan server: biarkan jalan tanpa DB
        return null;
    }
}
