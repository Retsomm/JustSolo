import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";

export const useFavorites = (page: number, options?: { enabled?: boolean }) => {
  const { status } = useSession();
  return trpc.favorite.list.useQuery(
    { page },
    { enabled: status === "authenticated" && (options?.enabled ?? true) },
  );
};
