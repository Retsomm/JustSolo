"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { useFavorites } from "@/hooks/useFavorites";
import { useToggleFavorite } from "@/hooks/useToggleFavorite";
import { trpc } from "@/lib/trpc";
import { soloSeatStatusLabel } from "@/lib/soloSeatLabel";
import { FriendlinessBadge } from "@/components/FriendlinessBadge";
import { AvatarUploader } from "@/components/AvatarUploader";
import { EditableName } from "@/components/EditableName";

const RemoveFavoriteButton = ({ restaurantId }: { restaurantId: string }) => {
  const utils = trpc.useUtils();
  const toggleFavorite = useToggleFavorite();

  return (
    <button
      type="button"
      disabled={toggleFavorite.isPending}
      onClick={() =>
        toggleFavorite.mutate(
          { restaurantId },
          { onSuccess: () => utils.favorite.list.invalidate() },
        )
      }
      className="shrink-0 cursor-pointer rounded border border-foreground/15 px-2 py-1 text-xs text-foreground hover:bg-foreground/5 disabled:opacity-50"
    >
      移除收藏
    </button>
  );
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { data: favorites, isLoading } = useFavorites();

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <AvatarUploader />
        <div>
          <EditableName />
          <p className="text-sm text-foreground/60">{session.user?.email}</p>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-foreground">我的收藏</h2>

        {isLoading && <p className="text-sm text-foreground/60">載入中…</p>}

        {!isLoading && favorites?.length === 0 && (
          <p className="text-sm text-foreground/60">
            尚無收藏資料，去餐廳詳情頁點愛心加入收藏吧。
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {favorites?.map((r) => (
            <li
              key={r.id}
              className="rounded border border-foreground/10 hover:bg-foreground/5"
            >
              <div className="flex items-start gap-2 p-4">
                <Link href={`/restaurant/${r.id}`} className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">{r.name}</h3>
                    <span className="shrink-0 text-xs text-foreground/50">
                      {r.categoryName}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/60">{r.address}</p>
                  <p className="mt-1 text-sm text-foreground/70">
                    {soloSeatStatusLabel(r.soloSeatStatus)}
                    {r.soloSeatType ? `・${r.soloSeatType}` : ""}
                  </p>
                  <div className="mt-2">
                    <FriendlinessBadge
                      score={r.soloFriendlinessScore}
                      label={r.soloFriendlinessLabel}
                    />
                  </div>
                </Link>
                <RemoveFavoriteButton restaurantId={r.id} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <button
        type="button"
        onClick={() => signOut()}
        className="cursor-pointer self-start rounded border border-foreground/15 px-3 py-1.5 text-sm text-foreground hover:bg-foreground/5"
      >
        登出
      </button>
    </main>
  );
}
