import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { getTheme, setTheme } from '../theme'

export default function Navbar() {
  const [q, setQ] = useState('')
  const [theme, setThemeState] = useState(getTheme())
  const navigate = useNavigate()

  const onSubmit = (e) => {
    e.preventDefault()
    if (q.trim()) {
      navigate('/?q=' + encodeURIComponent(q.trim()))
      setQ('')
    }
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  return (
    <header className="sticky top-0 z-50 bg-white/70 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="container-px max-w-7xl mx-auto flex items-center gap-4 py-3">
        <Link to="/" className="text-xl font-bold tracking-wide">
          <span className="text-brand">Moco</span>Manga
        </Link>

        <nav className="hidden md:flex items-center gap-4 text-sm">
          <Link to="/latest" className="hover:text-brand">Latest</Link>
          <Link to="/popular" className="hover:text-brand">Popular</Link>
          <Link to="/genres" className="hover:text-brand">Genres</Link>
          <Link to="/bookmarks" className="hover:text-brand">Bookmarks</Link>
          <Link to="/history" className="hover:text-brand">History</Link>
        </nav>

        <form onSubmit={onSubmit} className="ml-auto flex items-center gap-2 w-full md:w-auto">
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Search title…"
            className="w-full md:w-72 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-3 py-2 outline-none focus:ring-2 focus:ring-brand"
          />
          <button className="rounded-xl bg-brand/20 hover:bg-brand/30 border border-brand/40 px-3 py-2 text-brand font-medium">
            Search
          </button>
        </form>

        <button onClick={toggleTheme}
          className="rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm">
          {theme==='dark' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
    </header>
  )
}
