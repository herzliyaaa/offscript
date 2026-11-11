'use client';

import { useEffect, useState } from 'react';
import { MoonIcon, SunIcon } from '@/components/ui/Icons';

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
      className="icon-btn focus-ring h-9 w-9 border border-line bg-surface/60"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
    </button>
  );
}
