import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export const useFavoriteStatus = (restaurantId: string) => {
  const { status } = useAuth();
  return trpc.favorite.isFavorited.useQuery(
    { restaurantId },
    { enabled: status === "signedIn" },
  );
};
