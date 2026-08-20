"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { resolveTheme, toggleTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";
import { MoonIcon, SunIcon } from "@/components/icons/ThemeIcons";

const getStoredTheme = (): string | null => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
};

// 導覽連結／登入按鈕共用同一套「目前所在頁面」的高亮樣式。
const navItemClassName = (isActive: boolean) =>
  isActive
    ? "rounded bg-foreground px-3 py-1 text-sm text-background"
    : "rounded border border-foreground/15 px-3 py-1 text-sm text-foreground hover:bg-foreground/5";

const HomeLink = () => {
  const pathname = usePathname();
  const isActive = pathname === "/";

  return (
    <Link
      href="/"
      aria-current={isActive ? "page" : undefined}
      className={navItemClassName(isActive)}
    >
      首頁
    </Link>
  );
};

// 登入前顯示「登入」按鈕，登入後同一個位置變成「個人頁面」連結——
// 兩者是同一顆按鈕依登入狀態切換文字/行為，不是各自獨立的兩顆按鈕。
const ProfileOrLoginButton = () => {
  const { status } = useSession();
  const pathname = usePathname();

  if (status === "loading") return null;

  if (status === "authenticated") {
    const isActive = pathname === "/profile";
    return (
      <Link
        href="/profile"
        aria-current={isActive ? "page" : undefined}
        className={navItemClassName(isActive)}
      >
        個人頁面
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signIn("google")}
      className={`cursor-pointer ${navItemClassName(false)}`}
    >
      登入
    </button>
  );
};

export const NavBar = () => {
  // 初始值固定為 "light"，跟伺服器端渲染（`typeof window === "undefined"`）算出來的
  // 結果一致，避免 hydration 時因為讀到 localStorage/matchMedia 而跟伺服器渲染的
  // markup（圖示、aria-label）對不上。實際主題（手動選過的，或跟隨系統偏好）留到
  // 下面的 effect 裡、hydration 完成後才套用。
  const [theme, setTheme] = useState<Theme>("light");
  const isManualRef = useRef(false);

  useLayoutEffect(() => {
    const stored = getStoredTheme();
    const manual = stored === "light" || stored === "dark";
    isManualRef.current = manual;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const resolved = resolveTheme(stored, mediaQuery.matches);
    // 這裡故意在 effect 裡同步 setState：localStorage/matchMedia 是只有瀏覽器才有的
    // 外部系統，SSR 階段讀不到，只能等 hydration 完成、effect 跑過一次之後才能把
    // React state 校正成真正的主題（同一個 effect 底下緊接著訂閱 matchMedia 變化，
    // 屬於「讀外部系統初始值＋訂閱後續變化」的合法用法，不是可以在渲染時算出來的值）。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(resolved);

    // 手動選過的主題才寫 data-theme；系統偏好推導出來的主題移除這個屬性，
    // 交給 globals.css 的 `prefers-color-scheme` media query 接手。
    if (manual) {
      document.documentElement.setAttribute("data-theme", resolved);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }

    const handleChange = (event: MediaQueryListEvent) => {
      if (isManualRef.current) return;
      setTheme(event.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleToggle = () => {
    isManualRef.current = true;
    const next = toggleTheme(theme);
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
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
        <div className="flex items-center gap-2">
          <HomeLink />
          <ProfileOrLoginButton />
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
      </div>
    </nav>
  );
};
