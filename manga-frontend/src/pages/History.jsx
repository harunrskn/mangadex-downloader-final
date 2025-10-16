import { useMemo } from 'react'
import { useHistory } from '../hooks/useLocalBookmarks'
import { useNavigate } from 'react-router-dom'

export default function History(){
  const { list, clear } = useHistory()
  const navigate = useNavigate()

  const grouped = useMemo(()=>{
    // Group by mangaId if present
    const map = new Map()
    list.forEach(e => {
      const key = e.mangaId || 'unknown'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(e)
    })
    return Array.from(map.entries())
  }, [list])

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Reading History</h1>
        {list.length>0 && (
          <button onClick={clear} className="px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm">Clear</button>
        )}
      </div>

      {list.length===0 ? (
        <div className="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500">
          Belum ada riwayat. Buka chapter untuk mulai membaca.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([mangaId, entries]) => {
            const latest = entries[0]
            return (
              <div key={mangaId} className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-4 flex items-center gap-4 bg-white dark:bg-gray-900">
                  <div className="w-14 h-20 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
                    {latest.cover ? <img src={latest.cover} alt={latest.title} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{latest.title || 'Unknown title'}</div>
                    <div className="text-xs opacity-70">{entries.length} session</div>
                  </div>
                  <button onClick={()=>navigate(`/chapter/${latest.chapterId}`)}
                    className="px-3 py-2 rounded-xl border border-brand/50 bg-brand/20 text-brand text-sm">Resume</button>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {entries.map(e => (
                    <div key={e.chapterId} className="p-3 text-sm flex items-center justify-between">
                      <div>Chapter {e.chapterId}</div>
                      <div className="opacity-60">{new Date(e.when).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
