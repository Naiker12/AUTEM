import { useCallback, useEffect, useState } from "react";

const THEME_STORAGE_KEY = "autem-theme";

function readInitialTheme(): boolean {
  if (typeof document === "undefined") return false;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored === "dark";
  }
  return (
    document.documentElement.classList.contains("dark") ||
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(readInitialTheme);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", isDark);
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  return { isDark, setIsDark, toggleTheme };
}
