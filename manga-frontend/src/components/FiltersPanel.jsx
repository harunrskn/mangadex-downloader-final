import React from "react";
import { useSearchParams } from "react-router-dom";

export default function FiltersPanel({ showLetter = true }) {
  const [params, setParams] = useSearchParams();

  const setParam = (k, v) => {
    const p = new URLSearchParams(params);
    if (v === "" || v == null) p.delete(k);
    else p.set(k, v);
    p.set("page", "1");
    setParams(p, { replace: true });
  };

  const type = params.get("type") || "";
  const status = params.get("status") || "";
  const sort = params.get("sort") || "latest";
  const letter = params.get("letter") || "";

  return (
    <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <select className="px-3 py-2 rounded-xl border bg-transparent" value={type} onChange={(e)=>setParam("type", e.target.value)}>
        <option value="">All Types</option>
        <option value="manga">Manga</option>
        <option value="manhwa">Manhwa</option>
        <option value="manhua">Manhua</option>
      </select>

      <select className="px-3 py-2 rounded-xl border bg-transparent" value={status} onChange={(e)=>setParam("status", e.target.value)}>
        <option value="">All Status</option>
        <option value="ongoing">Ongoing</option>
        <option value="completed">Completed</option>
      </select>

      <select className="px-3 py-2 rounded-xl border bg-transparent" value={sort} onChange={(e)=>setParam("sort", e.target.value)}>
        <option value="latest">Latest</option>
        <option value="popular">Popular</option>
        <option value="az">A–Z</option>
        <option value="updated">Updated</option>
      </select>

      {showLetter && (
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-sm opacity-70 mr-2">Letter:</span>
          {["",..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((ch, i)=> (
            <button
              key={i}
              onClick={()=>setParam("letter", ch)}
              className={`px-2.5 py-1 rounded-lg border ${letter===ch ? "bg-gray-900 text-white dark:bg-white dark:text-black" : ""}`}
            >
              {ch || "ALL"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
