const KEY = 'moco_theme' // 'dark' | 'light'
export const getTheme = () => {
  if (typeof localStorage === 'undefined') return 'dark'
  return localStorage.getItem(KEY) || 'dark'
}
export const setTheme = (v) => {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(KEY, v)
  const html = document.documentElement
  if (v === 'dark') html.classList.add('dark')
  else html.classList.remove('dark')
}
export const initTheme = () => {
  setTheme(getTheme())
}
