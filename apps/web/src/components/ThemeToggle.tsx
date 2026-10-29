'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('theme');
    return stored ? stored === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded border border-zinc-300 dark:border-[#38444d] bg-white dark:bg-[#192734] px-3 py-1.5 text-sm font-medium text-zinc-900 dark:text-[#e7e9ea] hover:bg-zinc-100 dark:hover:bg-[#22303c]"
    >
      {dark ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
