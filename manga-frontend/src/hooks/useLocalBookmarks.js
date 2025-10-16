import { useEffect, useState } from 'react'
const BK_KEY = 'moco_bookmarks'  // array of {id, title, cover}
const RH_KEY = 'moco_history'    // array of {chapterId, when, mangaId?, title?, cover?}

const readJSON = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k) || '') || fallback } catch { return fallback }
}
const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v))

export function useBookmarks(){
  const [list, setList] = useState([])
  useEffect(()=>{ setList(readJSON(BK_KEY, [])) },[])

  const add = (m) => {
    setList(prev => {
      if (prev.some(x=>x.id===m.id)) return prev
      const next = [m, ...prev].slice(0, 500)
      writeJSON(BK_KEY, next)
      return next
    })
  }
  const remove = (id) => {
    setList(prev => {
      const next = prev.filter(x=>x.id!==id)
      writeJSON(BK_KEY, next)
      return next
    })
  }
  const toggle = (m) => {
    setList(prev => {
      const exists = prev.some(x=>x.id===m.id)
      const next = exists ? prev.filter(x=>x.id!==m.id) : [m, ...prev]
      writeJSON(BK_KEY, next)
      return next
    })
  }
  const has = (id) => list.some(x=>x.id===id)
  return { list, add, remove, toggle, has }
}

export function useHistory(){
  const [list, setList] = useState([])
  useEffect(()=>{ setList(readJSON(RH_KEY, [])) },[])
  const visit = (chapterId, meta={}) => {
    const entry = { chapterId, when: Date.now(), ...meta }
    setList(prev => {
      const filtered = prev.filter(x=>x.chapterId!==chapterId)
      const next = [entry, ...filtered].slice(0, 2000)
      writeJSON(RH_KEY, next)
      return next
    })
  }
  const clear = () => { writeJSON(RH_KEY, []); setList([]) }
  return { list, visit, clear }
}
