import { trpc } from "@/lib/trpc";
import type { SearchRestaurantsInput } from "@justsolo/shared";

export const useRestaurantSearch = (input: SearchRestaurantsInput) =>
  trpc.restaurant.search.useQuery(input);
