import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";

export const useMySoloSeatReport = (restaurantId: string) => {
  const { status } = useSession();
  return trpc.soloSeatReport.getMine.useQuery(
    { restaurantId },
    { enabled: status === "authenticated" },
  );
};
