import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { initTheme } from "./theme";

// 1) Inisialisasi tema sebelum render
initTheme();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// 2) Registrasi Service Worker dengan path yang benar untuk Vite.
//    Pindahkan file sw.js ke `public/sw.js` (bukan di src/).
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`; // => /sw.js saat base default
    navigator.serviceWorker.register(swUrl).catch(() => { });
  });
}

/* 3) Hapus override console.warn agar warning React Router tidak “dibalut” stack custom.
   Kalau butuh debugging sementara, aktifkan snippet di bawah hanya saat dev:
   if (import.meta.env.DEV) {
     const origWarn = console.warn;
     console.warn = (...args) => {
       origWarn(...args);
     };
   }
*/
