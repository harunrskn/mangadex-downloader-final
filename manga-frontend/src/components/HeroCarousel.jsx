import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

function slugify(s){return s?.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')||'manga'}

export default function HeroCarousel({ items = [] }){
  const [idx, setIdx] = useState(0)
  const timer = useRef(null)
  const max = Math.max(0, Math.min(items.length, 6)) // up to 6 items
  const slides = items.slice(0, max)

  useEffect(()=>{
    timer.current = setInterval(()=> setIdx((i)=> (i+1) % (slides.length || 1)), 5000)
    return ()=> clearInterval(timer.current)
  }, [slides.length])

  if (slides.length === 0) return null

  const go = (i)=> setIdx(i)

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 mb-6">
      <div className="relative">
        {slides.map((m, i) => {
          const active = i === idx
          const slug = slugify(m.title)
          return (
            <Link key={m.id+':hero'} to={`/manga/${m.id}/${slug}`}
              className={`block transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'} absolute inset-0`}
              style={{position:'absolute'}}
            >
              {m.cover ? (
                <img src={m.cover} alt={m.title} className="w-full h-64 md:h-96 object-cover" />
              ) : (
                <div className="w-full h-64 md:h-96 bg-gray-200 dark:bg-gray-800" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                <div className="text-sm opacity-80">Featured</div>
                <h3 className="text-2xl md:text-3xl font-extrabold">{m.title}</h3>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {(m.genre||[]).slice(0,4).map(g=> <span key={g} className="px-2 py-1 rounded bg-white/20 text-white text-xs border border-white/30">{g}</span>)}
                </div>
              </div>
            </Link>
          )
        })}
        {/* container height holder */}
        <div className="invisible">
          <img alt="" className="w-full h-64 md:h-96 object-cover" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 py-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        {slides.map((_,i)=>(
          <button key={i} onClick={()=>go(i)} className={`h-2 w-2 rounded-full ${i===idx?'bg-brand':'bg-gray-300 dark:bg-gray-700'}`}></button>
        ))}
      </div>
    </div>
  )
}
