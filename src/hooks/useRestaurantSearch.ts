import { trpc } from "@/lib/trpc";
import type { SearchRestaurantsInput } from "@/types/restaurant";

export const useRestaurantSearch = (input: SearchRestaurantsInput) =>
  trpc.restaurant.search.useQuery(input);
