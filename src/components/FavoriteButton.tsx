"use client";

import { signIn, useSession } from "next-auth/react";
import { useFavoriteStatus } from "@/hooks/useFavoriteStatus";
import { useToggleFavorite } from "@/hooks/useToggleFavorite";
import { trpc } from "@/lib/trpc";
import { HeartFilledIcon, HeartOutlineIcon } from "@/components/icons/FavoriteIcons";

type FavoriteButtonProps = {
  restaurantId: string;
};

export const FavoriteButton = ({ restaurantId }: FavoriteButtonProps) => {
  const { status } = useSession();
  const utils = trpc.useUtils();
  const { data: isFavorited } = useFavoriteStatus(restaurantId);
  const toggleFavorite = useToggleFavorite();

  if (status !== "authenticated") {
    return (
      <button
        type="button"
        onClick={() => signIn("google")}
        aria-label="登入後即可收藏"
        className="cursor-pointer rounded border border-foreground/15 p-2 text-foreground/60 hover:bg-foreground/5"
      >
        <HeartOutlineIcon className="h-5 w-5" />
      </button>
    );
  }

  const handleClick = () => {
    toggleFavorite.mutate(
      { restaurantId },
      {
        onSuccess: () => {
          utils.favorite.isFavorited.invalidate({ restaurantId });
          utils.favorite.list.invalidate();
        },
      },
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggleFavorite.isPending}
      aria-pressed={isFavorited === true}
      aria-label={isFavorited ? "取消收藏" : "加入收藏"}
      className="cursor-pointer rounded border border-foreground/15 p-2 text-foreground hover:bg-foreground/5 disabled:opacity-50"
    >
      {isFavorited ? (
        <HeartFilledIcon className="h-5 w-5" />
      ) : (
        <HeartOutlineIcon className="h-5 w-5" />
      )}
    </button>
  );
};
