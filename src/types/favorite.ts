import { z } from "zod";

export const favoriteRestaurantInputSchema = z.object({
  restaurantId: z.string(),
});

export type FavoriteRestaurantInput = z.infer<
  typeof favoriteRestaurantInputSchema
>;
