import { trpc } from "@/lib/trpc";
import type { PickRestaurantInput } from "@justsolo/shared";

export const useRestaurantPick = (input: PickRestaurantInput) =>
  trpc.restaurant.pickOne.useQuery(input);
