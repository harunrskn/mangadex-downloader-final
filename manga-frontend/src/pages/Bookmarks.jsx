import { useBookmarks } from "../hooks/useLocalBookmarks";
import MangaCard from "../components/MangaCard";

export default function Bookmarks() {
  const { list = [], loading } = useBookmarks(); // fallback default array

  return (
    <main className="mx-auto max-w-7xl px-3 py-6">
      <section>
        <h1 className="text-2xl font-bold mb-4">Bookmarks</h1>

        {loading ? (
          <div className="p-6 text-gray-500">Loading…</div>
        ) : list.length === 0 ? (
          <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500">
            Belum ada bookmark. Klik{" "}
            <span className="font-semibold">☆ Save</span> pada kartu manga
            untuk menyimpan.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {list.map((m) => (
              <MangaCard key={m.id || m.slug} item={m} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
