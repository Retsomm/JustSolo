"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { useFavorites } from "@/hooks/useFavorites";
import { useToggleFavorite } from "@/hooks/useToggleFavorite";
import { trpc } from "@/lib/trpc";
import { soloSeatStatusLabel } from "@/lib/soloSeatLabel";
import { FriendlinessBadge } from "@/components/FriendlinessBadge";
import { AvatarUploader } from "@/components/AvatarUploader";
import { EditableName } from "@/components/EditableName";
import { Pagination } from "@/components/Pagination";

type TabKey = "profile" | "favorites";

const TABS: { key: TabKey; label: string }[] = [
  { key: "profile", label: "個人資料" },
  { key: "favorites", label: "我的收藏" },
];

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
      className="shrink-0 cursor-pointer rounded border border-foreground/15 px-2 py-1 text-xs text-foreground hover:bg-foreground/5 disabled:opacity-50"
    >
      移除收藏
    </button>
  );
};

const ProfilePage = () => {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [page, setPage] = useState(1);
  const { data: favorites, isLoading } = useFavorites(page);

  if (status === "loading") return null;

  if (status !== "authenticated") {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 pb-6 pt-20">
        <p className="text-sm text-foreground/70">登入後即可查看個人頁面與收藏清單。</p>
        <button
          type="button"
          onClick={() => signIn("google")}
          className="cursor-pointer self-start rounded border border-foreground/15 px-3 py-1.5 text-sm text-foreground hover:bg-foreground/5"
        >
          登入
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 pb-6 pt-20">
      <div
        role="tablist"
        aria-label="個人頁面分類"
        className="flex flex-wrap gap-2"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={
              activeTab === tab.key
                ? "rounded bg-foreground px-3 py-1 text-sm text-background"
                : "rounded border border-foreground/15 px-3 py-1 text-sm text-foreground hover:bg-foreground/5"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" ? (
        <div className="flex flex-col items-center gap-8 sm:items-start">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <AvatarUploader />
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <EditableName />
              <p className="text-sm text-foreground/60">{session.user?.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut()}
            className="cursor-pointer rounded border border-foreground/15 px-3 py-1.5 text-sm text-foreground hover:bg-foreground/5"
          >
            登出
          </button>
        </div>
      ) : (
        <section className="flex flex-col gap-3">
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
                className="rounded border border-foreground/10 hover:bg-foreground/5"
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
                    <p className="mt-1 text-sm text-foreground/70">
                      {soloSeatStatusLabel(r.soloSeatStatus)}
                      {r.soloSeatType ? `・${r.soloSeatType}` : ""}
                    </p>
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

export default ProfilePage;
