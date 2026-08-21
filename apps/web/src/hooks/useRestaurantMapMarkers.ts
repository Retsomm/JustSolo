import { trpc } from "@/lib/trpc";
import type { RestaurantFilterInput } from "@justsolo/shared";

export const useRestaurantMapMarkers = (
  input: RestaurantFilterInput,
  options?: { enabled?: boolean },
) => trpc.restaurant.mapMarkers.useQuery(input, options);
