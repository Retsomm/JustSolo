import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import {
  pickRestaurantInputSchema,
  restaurantFilterInputSchema,
  searchRestaurantsInputSchema,
} from "../../types/restaurant";
import {
  getRestaurantById,
  getRestaurantMapMarkers,
  pickRandomRestaurant,
  searchRestaurants,
} from "../services/restaurantSearchService";
import { getRestaurantPlaceDetails } from "../services/placeDetailsService";

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

  pickOne: publicProcedure
    .input(pickRestaurantInputSchema)
    .query(({ input }) => pickRandomRestaurant(input)),

  placeDetails: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => getRestaurantPlaceDetails(input.id)),
});
