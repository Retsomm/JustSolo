import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";

export const useFavorites = () => {
  const { status } = useSession();
  return trpc.favorite.list.useQuery(undefined, {
    enabled: status === "authenticated",
  });
};
