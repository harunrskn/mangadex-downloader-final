import React from "react";
export default function Empty({ title="Tidak ada data", subtitle="Coba ganti filter atau kata kunci." }){
  return (
    <div className="text-center py-16 border rounded-2xl border-dashed border-gray-300 dark:border-gray-700">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="opacity-70 mt-1">{subtitle}</p>
    </div>
  );
}
