import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";

export const useFavorites = (page: number) => {
  const { status } = useSession();
  return trpc.favorite.list.useQuery(
    { page },
    { enabled: status === "authenticated" },
  );
};
