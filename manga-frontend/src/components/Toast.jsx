import React from "react";
export default function Toast({ message, onClose }){
  if (!message) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="px-4 py-2 rounded-xl shadow-lg bg-gray-900 text-white dark:bg-white dark:text-black">
        {message}
      </div>
    </div>
  );
}
