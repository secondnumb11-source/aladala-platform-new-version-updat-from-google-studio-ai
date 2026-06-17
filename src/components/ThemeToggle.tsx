import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export default function ThemeToggle() {
  const { preferences, updatePreference, loading } = useUserPreferences();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (!loading && preferences?.theme) {
      const isDarkMode = preferences.theme === 'dark';
      setIsDark(isDarkMode);
      document.documentElement.classList.toggle('dark', isDarkMode);
    } else if (!loading) {
      // Fallback to system preference if no user preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, [loading, preferences?.theme]);

  const toggleTheme = () => {
    const newDark = !isDark;
    const themeToSave = newDark ? 'dark' : 'light';
    setIsDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    updatePreference('theme', themeToSave);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 rounded-lg bg-slate-800 text-amber-400 transition-colors border border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/50 shadow-sm"
      title={isDark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
