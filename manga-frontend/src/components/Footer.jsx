export default function Footer(){
  return (
    <footer className="border-t border-gray-800 mt-12">
      <div className="container-px max-w-7xl mx-auto py-8 text-sm text-gray-400">
        <p>© {new Date().getFullYear()} MocoManga · Built with ❤️ · Data via your local API</p>
      </div>
    </footer>
  )
}
