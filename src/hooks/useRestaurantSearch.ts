import { trpc } from "@/lib/trpc";
import type { SearchRestaurantsInput } from "@/types/restaurant";

export const useRestaurantSearch = (
  input: SearchRestaurantsInput,
  options?: { enabled?: boolean },
) => trpc.restaurant.search.useQuery(input, options);
