import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export const useMySoloSeatReport = (restaurantId: string) => {
  const { status } = useAuth();
  return trpc.soloSeatReport.getMine.useQuery(
    { restaurantId },
    { enabled: status === "signedIn" },
  );
};
