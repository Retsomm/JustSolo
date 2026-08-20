import { z } from "zod";
import { router, publicProcedure } from "@/server/trpc";
import {
  restaurantFilterInputSchema,
  searchRestaurantsInputSchema,
} from "@/types/restaurant";
import {
  getRestaurantById,
  getRestaurantMapMarkers,
  searchRestaurants,
} from "@/server/services/restaurantSearchService";

export const restaurantRouter = router({
  search: publicProcedure
    .input(searchRestaurantsInputSchema)
    .query(({ input }) => searchRestaurants(input)),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => getRestaurantById(input.id)),

  mapMarkers: publicProcedure
    .input(restaurantFilterInputSchema)
    .query(({ input }) => getRestaurantMapMarkers(input)),
});
