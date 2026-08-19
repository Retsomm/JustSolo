import { router, publicProcedure } from "@/server/trpc";
import { searchRestaurantsInputSchema } from "@/types/restaurant";
import { searchRestaurants } from "@/server/services/restaurantSearchService";

export const restaurantRouter = router({
  search: publicProcedure
    .input(searchRestaurantsInputSchema)
    .query(({ input }) => searchRestaurants(input)),
});
