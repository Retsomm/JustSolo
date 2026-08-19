"use client";

import { useLayoutEffect, useState } from "react";
import { resolveTheme, toggleTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";
import { MoonIcon, SunIcon } from "@/components/icons/ThemeIcons";

const getStoredTheme = (): string | null => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
};

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return resolveTheme(getStoredTheme(), prefersDark);
};

export const NavBar = () => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // React Strict Mode 在開發模式下重新掛載元件時，會把 <html> 上非 JSX 管理的屬性
  // （包含 head 內 inline script 設定的 data-theme）清掉，這裡在繪製前重新套用一次
  // 補回來；正式環境沒有 Strict Mode 重掛載，這裡只是把已經正確的狀態再寫一次，無副作用。
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleToggle = () => {
    const next = toggleTheme(theme);
    setTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage 被封鎖（例如無痕模式）時，主題還是能切換，只是不會記住。
    }
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-20 h-14 border-b border-foreground/10 bg-background">
      <div className="mx-auto flex h-full w-full max-w-2xl items-center justify-between px-6">
        <span className="text-lg font-bold text-foreground">JustSolo</span>
        <button
          type="button"
          onClick={handleToggle}
          aria-label={theme === "dark" ? "切換成淺色主題" : "切換成深色主題"}
          className="cursor-pointer rounded border border-foreground/15 p-2 text-foreground hover:bg-foreground/5"
        >
          {theme === "dark" ? (
            <MoonIcon className="h-4 w-4" />
          ) : (
            <SunIcon className="h-4 w-4" />
          )}
        </button>
      </div>
    </nav>
  );
};
