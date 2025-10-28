import { execSync } from "child_process";
import fs from "fs";

console.log("🚀 Membersihkan file besar (>100MB) dari Git history...");

try {
    // Cek file besar yang masih di working directory (folder project)
    const files = fs.readdirSync(".", { withFileTypes: true })
        .filter(f => f.isFile())
        .map(f => ({
            name: f.name,
            size: fs.statSync(f.name).size
        }))
        .filter(f => f.size > 100 * 1024 * 1024);

    if (files.length === 0) {
        console.log("✅ Tidak ada file besar di folder utama.");
    } else {
        console.log("⚠️ Ditemukan file besar:");
        files.forEach(f => console.log(` - ${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`));

        // Hapus file besar dari repo
        execSync('git rm --cached --ignore-unmatch *.zip', { stdio: "inherit" });
    }

    // Hapus file ZIP dari semua commit di riwayat Git
    console.log("🧹 Menghapus file ZIP dari seluruh riwayat commit...");
    execSync('git filter-branch --force --index-filter "git rm --cached --ignore-unmatch *.zip" --prune-empty --tag-name-filter cat -- --all', { stdio: "inherit" });

    // Bersihkan cache Git
    execSync("git reflog expire --expire=now --all");
    execSync("git gc --prune=now --aggressive");

    console.log("✅ Semua file besar sudah dihapus dari riwayat Git!");
    console.log("🚀 Sekarang jalankan: git push origin main --force");
} catch (err) {
    console.error("❌ Error:", err.message);
}
