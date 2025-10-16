import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import FiltersPanel from "../components/FiltersPanel";
import Empty from "../components/Empty";
import { fetchMangaList } from "../services/api";

export default function Latest() {
  const [params] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const query = {"sort":"latest"};

  const opts = {
    q: params.get("q") || undefined,
    genre: params.get("genre") || undefined,
    status: params.get("status") || undefined,
    type: params.get("type") || undefined,
    letter: params.get("letter") || undefined,
    sort: params.get("sort") || query.sort,
    page: parseInt(params.get("page")||"1",10),
    limit: parseInt(params.get("limit")||"24",10),
  };

  useEffect(()=>{
    let live = true;
    setLoading(true);
    (async()=>{
      const { manga, total } = await fetchMangaList(opts);
      if (!live) return;
      setItems(manga);
      setTotal(total);
      setLoading(false);
    })();
    return ()=>{ live=false; };
  }, [params.toString()]);

  return (
    <div className="mx-auto max-w-6xl px-3 py-6">
      <FiltersPanel />
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_,i)=>(
            <div key={i} className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : items.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map(m => (
            <a key={m.id} href={`/detail/${encodeURIComponent(m.slug||m.id)}`} className="block border rounded-xl overflow-hidden hover:shadow">
              <img src={m.cover} alt={m.title} loading="lazy" decoding="async" />
              <div className="p-2 text-sm line-clamp-2">{m.title}</div>
            </a>
          ))}
        </div>
      ) : (
        <Empty title="Tidak ada hasil" />
      )}
    </div>
  );
}
