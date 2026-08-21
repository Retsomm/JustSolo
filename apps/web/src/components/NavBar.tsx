"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

// 導覽連結共用同一套樣式：預設沿用內文色，滑過/目前頁面變成 accent 色，
// 比照設計稿 `.nav a:hover, .nav a[aria-current='page']{color:var(--color-accent)}`。
const navLinkClassName = (isActive: boolean) =>
  isActive
    ? "text-sm text-accent"
    : "text-sm text-foreground hover:text-accent";

const NavLink = ({
  href,
  isActive,
  children,
}: {
  href: string;
  isActive: boolean;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    aria-current={isActive ? "page" : undefined}
    className={navLinkClassName(isActive)}
  >
    {children}
  </Link>
);

// 「收藏」跟「我的」都連到 /profile，差別只在 ?tab= query string，要知道哪個
// 該高亮必須讀 useSearchParams——這個 hook 會讓用到它的部分需要包一層
// Suspense，所以把它獨立成一個小元件，不要讓整個 NavBar（含首頁/地圖等
// 靜態頁面也會用到）都被迫跟著變成需要 Suspense 的動態內容。
const ProfileNavLinks = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isOnProfilePage = pathname === "/profile";
  const isFavoritesTab = searchParams.get("tab") === "favorites";

  return (
    <>
      <NavLink
        href="/profile?tab=favorites"
        isActive={isOnProfilePage && isFavoritesTab}
      >
        收藏
      </NavLink>
      <NavLink href="/profile" isActive={isOnProfilePage && !isFavoritesTab}>
        我的
      </NavLink>
    </>
  );
};

// Suspense 還沒 resolve（或還沒 hydrate）前的 fallback：兩個連結都先不標示
// 高亮，避免整段導覽列在等 searchParams 時完全空白造成版面跳動。
const ProfileNavLinksFallback = () => (
  <>
    <NavLink href="/profile?tab=favorites" isActive={false}>
      收藏
    </NavLink>
    <NavLink href="/profile" isActive={false}>
      我的
    </NavLink>
  </>
);

export const NavBar = () => {
  const pathname = usePathname();
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  return (
    <nav className="fixed inset-x-0 top-0 z-20 flex h-14 items-center gap-4 border-b border-divider bg-background px-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl items-center gap-4">
        <span className="mr-auto font-heading text-lg text-foreground">
          JustSolo
        </span>

        <NavLink href="/" isActive={pathname === "/"}>
          首頁
        </NavLink>
        <NavLink href="/map" isActive={pathname === "/map"}>
          地圖
        </NavLink>

        {status === "loading" ? null : isLoggedIn ? (
          <Suspense fallback={<ProfileNavLinksFallback />}>
            <ProfileNavLinks />
          </Suspense>
        ) : (
          <button
            type="button"
            onClick={() => signIn("google")}
            className="cursor-pointer rounded-full border border-divider px-3 py-1 text-sm text-foreground hover:bg-foreground/5"
          >
            登入
          </button>
        )}
      </div>
    </nav>
  );
};
