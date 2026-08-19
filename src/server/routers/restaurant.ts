import { z } from "zod";
import { router, publicProcedure } from "@/server/trpc";
import { searchRestaurantsInputSchema } from "@/types/restaurant";
import {
  getRestaurantById,
  searchRestaurants,
} from "@/server/services/restaurantSearchService";

export const restaurantRouter = router({
  search: publicProcedure
    .input(searchRestaurantsInputSchema)
    .query(({ input }) => searchRestaurants(input)),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => getRestaurantById(input.id)),
});
