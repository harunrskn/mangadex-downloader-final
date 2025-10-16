// merge-cms.js
import fs from "fs";
import path from "path";
import unzipper from "unzipper";

// Cari file ZIP secara otomatis di root project
function findZip(baseDir, fileName = "manga-cms-admin.zip") {
  const files = fs.readdirSync(baseDir);
  for (const f of files) {
    const fullPath = path.join(baseDir, f);
    const stat = fs.statSync(fullPath);

    if (stat.isFile() && f === fileName) {
      return fullPath;
    }
    if (stat.isDirectory()) {
      try {
        const found = findZip(fullPath, fileName);
        if (found) return found;
      } catch {
        // skip folder permission error
      }
    }
  }
  return null;
}

async function main() {
  const ROOT = process.cwd();
  const zipPath =
    findZip(ROOT, "manga-cms-admin.zip") ||
    path.join(ROOT, "manga-cms-admin.zip");

  if (!fs.existsSync(zipPath)) {
    console.error("❌ File manga-cms-admin.zip tidak ditemukan di:", ROOT);
    return;
  }

  console.log("📦 Mengekstrak CMS dari:", zipPath);

  const tempDir = path.join(ROOT, "cms-temp");

  // pastikan tempDir kosong
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir);

  // ekstrak zip
  await fs
    .createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: tempDir }))
    .promise();

  // Copy backend → server/
  const serverSrc = path.join(tempDir, "server");
  const serverDest = path.join(ROOT, "server");
  if (fs.existsSync(serverSrc)) {
    fs.cpSync(serverSrc, serverDest, { recursive: true });
    console.log("✅ Backend CMS digabung ke:", serverDest);
  }

  // Copy frontend → manga-frontend/src/pages/admin/
  const frontendSrc = path.join(tempDir, "manga-frontend", "src", "pages", "admin");
  const frontendDest = path.join(ROOT, "manga-frontend", "src", "pages", "admin");

  if (fs.existsSync(frontendSrc)) {
    fs.mkdirSync(frontendDest, { recursive: true });
    fs.cpSync(frontendSrc, frontendDest, { recursive: true });
    console.log("✅ Frontend CMS digabung ke:", frontendDest);
  }

  // Bersihkan temp
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log("🎉 Merge selesai!");
}

main().catch((e) => {
  console.error("❌ Gagal merge:", e);
});
