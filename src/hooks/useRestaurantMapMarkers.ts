import { trpc } from "@/lib/trpc";
import type { RestaurantFilterInput } from "@/types/restaurant";

export const useRestaurantMapMarkers = (
  input: RestaurantFilterInput,
  options?: { enabled?: boolean },
) => trpc.restaurant.mapMarkers.useQuery(input, options);
