import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export const useFavorites = (page: number) => {
  const { status } = useAuth();
  return trpc.favorite.list.useQuery(
    { page },
    { enabled: status === "signedIn" },
  );
};
