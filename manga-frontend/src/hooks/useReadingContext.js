import { useEffect, useState } from 'react'
const KEY = 'moco_reading_context' // { mangaId, title, cover, chapters:[ids], index }
const readJSON = () => { try { return JSON.parse(localStorage.getItem(KEY)||'') || null } catch { return null } }
const writeJSON = (v) => localStorage.setItem(KEY, JSON.stringify(v))

export function setReadingContext(ctx){ writeJSON(ctx) }
export function getReadingContext(){ return readJSON() }
export function updateReadingIndex(index){
  const ctx = readJSON()
  if (!ctx) return
  ctx.index = index
  writeJSON(ctx)
}

export function useReadingContext(){
  const [ctx, setCtx] = useState(null)
  useEffect(()=>{ setCtx(readJSON()) },[])
  return { ctx, refresh: ()=> setCtx(readJSON()) }
}
