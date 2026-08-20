import { z } from "zod";

export const favoriteRestaurantInputSchema = z.object({
  restaurantId: z.string(),
});

export type FavoriteRestaurantInput = z.infer<
  typeof favoriteRestaurantInputSchema
>;

export const listFavoritesInputSchema = z.object({
  page: z.number().int().min(1).default(1),
});

export type ListFavoritesInput = z.infer<typeof listFavoritesInputSchema>;
