import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";

export const useFavoriteStatus = (restaurantId: string) => {
  const { status } = useSession();
  return trpc.favorite.isFavorited.useQuery(
    { restaurantId },
    { enabled: status === "authenticated" },
  );
};
