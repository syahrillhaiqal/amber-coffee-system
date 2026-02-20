import React from "react";

export default function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 text-center text-xs text-stone-600">
        <p>Amber Coffee System v{__APP_VERSION__}</p>
        <p className="mt-1">© {year} Amber Coffee. All rights reserved.</p>
      </div>
    </footer>
  );
}