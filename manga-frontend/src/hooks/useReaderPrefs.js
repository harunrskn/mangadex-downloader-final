import { useEffect, useState } from "react";
const KEY = "moco_reader_prefs"; // { fit, zoom, direction }

const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "") || { fit:"width", zoom:1, direction:"rtl" } } catch { return { fit:"width", zoom:1, direction:"rtl" } } };
const write = (v) => localStorage.setItem(KEY, JSON.stringify(v));

export function useReaderPrefs(){
  const [prefs, setPrefs] = useState(read());

  useEffect(()=>{ setPrefs(read()) }, []);

  const set = (patch) => {
    setPrefs(prev => {
      const next = { ...prev, ...patch };
      write(next);
      return next;
    });
  };

  return { prefs, set };
}
