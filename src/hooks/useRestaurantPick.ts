import { trpc } from "@/lib/trpc";
import type { PickRestaurantInput } from "@/types/restaurant";

export const useRestaurantPick = (input: PickRestaurantInput) =>
  trpc.restaurant.pickOne.useQuery(input);
