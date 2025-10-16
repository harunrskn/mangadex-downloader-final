export default function Pagination({ total, limit, offset, onPage }){
  const current = Math.floor(offset / limit) + 1
  const pages = Math.max(1, Math.ceil(total / limit))

  const go = (p) => {
    const newOffset = (p-1)*limit
    onPage(newOffset)
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button onClick={()=>go(Math.max(1,current-1))} disabled={current===1}
        className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 disabled:opacity-50">Prev</button>
      <span className="text-sm opacity-80">Page {current} / {pages}</span>
      <button onClick={()=>go(Math.min(pages,current+1))} disabled={current===pages}
        className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 disabled:opacity-50">Next</button>
    </div>
  )
}
