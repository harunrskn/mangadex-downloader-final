// src/App.jsx
import { Routes, Route, useParams } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Detail from "./pages/Detail";
import Reader from "./pages/Reader";
import NotFound from "./pages/NotFound";
import Bookmarks from "./pages/Bookmarks";
import Popular from "./pages/Popular";
import Latest from "./pages/Latest";
import Genres from "./pages/Genres";
import History from "./pages/History";

function DetailWrapper() {
  const { id } = useParams();
  return <Detail key={id} />;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-1 container-px max-w-7xl mx-auto w-full py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/latest" element={<Latest />} />
          <Route path="/popular" element={<Popular />} />
          <Route path="/genres" element={<Genres />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/history" element={<History />} />

          {/* Detail manga: ID wajib (slug opsional utk SEO) */}
          <Route path="/manga/:id/:slug?" element={<DetailWrapper />} />

          {/* Reader: skema /reader/:id/:chapterId */}
          <Route path="/reader/:id/:chapterId" element={<Reader />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
