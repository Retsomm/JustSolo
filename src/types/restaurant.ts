import { z } from "zod";

export const soloSeatStatusSchema = z.enum([
  "CONFIRMED_YES",
  "CONFIRMED_NO",
  "UNKNOWN",
]);

export type SoloSeatStatus = z.infer<typeof soloSeatStatusSchema>;

export const restaurantFilterInputSchema = z.object({
  category: z.string().optional(),
  district: z.string().optional(),
  keyword: z.string().optional(),
  city: z.string().default("台中市"),
  soloSeatOnly: z.boolean().default(false),
});

export type RestaurantFilterInput = z.infer<typeof restaurantFilterInputSchema>;

export const searchRestaurantsInputSchema = restaurantFilterInputSchema.extend({
  page: z.number().int().min(1).default(1),
});

export type SearchRestaurantsInput = z.infer<
  typeof searchRestaurantsInputSchema
>;

export type RestaurantSearchResult = {
  id: string;
  name: string;
  categoryName: string;
  city: string;
  district: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
  soloSeatStatus: SoloSeatStatus;
  soloSeatType: string | null;
};

export type RestaurantMapMarker = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  soloSeatStatus: SoloSeatStatus;
};

export type PaginatedRestaurants = {
  items: RestaurantSearchResult[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type RestaurantDetail = RestaurantSearchResult & {
  phone: string | null;
  soloSeatConfidence: number;
  reportCount: number;
};
