"use client";

import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useFavorites } from "@/hooks/useFavorites";
import { useToggleFavorite } from "@/hooks/useToggleFavorite";
import { trpc } from "@/lib/trpc";
import { resolveTheme, toggleTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";
import { FriendlinessBadge } from "@/components/FriendlinessBadge";
import { AvatarUploader } from "@/components/AvatarUploader";
import { EditableName } from "@/components/EditableName";
import { Pagination } from "@/components/Pagination";
import { MoonIcon, SunIcon } from "@/components/icons/ThemeIcons";

const getStoredTheme = (): string | null => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
};

const ThemeToggleButton = () => {
  // 初始值固定 "light"（跟 SSR 一致），hydration 完成後在 effect 裡校正，
  // 比照 NavBar.tsx 原本的做法避免 hydration mismatch。
  const [theme, setTheme] = useState<Theme>("light");

  useLayoutEffect(() => {
    const stored = getStoredTheme();
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(resolveTheme(stored, prefersDark));
  }, []);

  const handleToggle = () => {
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
    <button
      type="button"
      onClick={handleToggle}
      aria-label={theme === "dark" ? "切換成淺色主題" : "切換成深色主題"}
      className="cursor-pointer rounded-full border border-divider p-2 text-foreground hover:bg-foreground/5"
    >
      {theme === "dark" ? (
        <MoonIcon className="h-4 w-4" />
      ) : (
        <SunIcon className="h-4 w-4" />
      )}
    </button>
  );
};

const RemoveFavoriteButton = ({ restaurantId }: { restaurantId: string }) => {
  const utils = trpc.useUtils();
  const toggleFavorite = useToggleFavorite();

  return (
    <button
      type="button"
      disabled={toggleFavorite.isPending}
      onClick={() =>
        toggleFavorite.mutate(
          { restaurantId, isFavorited: false },
          {
            onSuccess: () => {
              utils.favorite.isFavorited.invalidate({ restaurantId });
              utils.favorite.list.invalidate();
            },
          },
        )
      }
      className="shrink-0 cursor-pointer rounded-full border border-divider px-3 py-1 text-xs text-foreground hover:bg-foreground/5 disabled:opacity-50"
    >
      移除收藏
    </button>
  );
};

export const ProfileView = () => {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  // 「我的」「收藏」是 NavBar 上兩個各自獨立的連結（/profile、
  // /profile?tab=favorites），不是頁面內可以互相切換的分頁——每個網址只顯示
  // 自己對應的那份資料，切換靠導覽列本身，頁面裡不需要另外畫分頁按鈕。
  const activeTab = searchParams.get("tab") === "favorites" ? "favorites" : "profile";
  const [page, setPage] = useState(1);
  const { data: favorites, isLoading } = useFavorites(page, {
    enabled: activeTab === "favorites",
  });

  if (status === "loading") return null;

  if (status !== "authenticated") {
    return (
      <main className="mx-auto flex w-full max-w-130 flex-col items-center gap-4 px-4 pb-8 pt-20 text-center">
        <p className="text-sm text-foreground/70">
          登入後即可查看個人頁面與收藏清單。
        </p>
        <button
          type="button"
          onClick={() => signIn("google")}
          className="cursor-pointer rounded-full bg-accent px-4 py-1.5 text-sm text-background hover:bg-(--color-accent-600)"
        >
          登入
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-130 flex-col items-center gap-6 px-4 pb-8 pt-20 text-center">
      {activeTab === "profile" ? (
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-3">
            <AvatarUploader />
            <EditableName />
            <p className="text-sm text-foreground/60">{session.user?.email}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => signOut()}
              className="cursor-pointer rounded-full border border-divider px-4 py-1.5 text-sm text-foreground hover:bg-foreground/5"
            >
              登出
            </button>
            <ThemeToggleButton />
          </div>
        </div>
      ) : (
        <section className="flex w-full flex-col gap-3 text-left">
          {favorites && (
            <p className="text-center text-sm text-foreground/60">
              收藏了 {favorites.totalCount} 個安心去處
            </p>
          )}

          {isLoading && <p className="text-sm text-foreground/60">載入中…</p>}

          {!isLoading && favorites?.items.length === 0 && (
            <p className="text-sm text-foreground/60">
              尚無收藏資料，去餐廳詳情頁點愛心加入收藏吧。
            </p>
          )}

          <ul className="flex flex-col gap-3">
            {favorites?.items.map((r) => (
              <li
                key={r.id}
                className="rounded-3xl border border-divider bg-surface hover:bg-foreground/5"
              >
                <div className="p-4">
                  <Link href={`/restaurant/${r.id}`} className="block">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="min-w-0 flex-1 font-semibold text-foreground">
                        {r.name}
                      </h3>
                      <span className="shrink-0 text-xs text-foreground/50">
                        {r.categoryName}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/60">{r.address}</p>
                    {r.soloSeatType && (
                      <p className="mt-1 text-sm text-foreground/70">{r.soloSeatType}</p>
                    )}
                  </Link>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <FriendlinessBadge
                      score={r.soloFriendlinessScore}
                      label={r.soloFriendlinessLabel}
                    />
                    <RemoveFavoriteButton restaurantId={r.id} />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {favorites && (
            <Pagination
              page={favorites.page}
              totalPages={favorites.totalPages}
              onPageChange={setPage}
            />
          )}
        </section>
      )}
    </main>
  );
};

export default ProfileView;
