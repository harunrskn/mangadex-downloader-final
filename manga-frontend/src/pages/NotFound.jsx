import { Link } from 'react-router-dom'
export default function NotFound(){
  return (
    <div className="text-center py-24">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-gray-400 mb-6">Page not found.</p>
      <Link to="/" className="text-brand hover:underline">Go Home</Link>
    </div>
  )
}
