import { z } from "zod";

export const soloSeatStatusSchema = z.enum([
  "CONFIRMED_YES",
  "CONFIRMED_NO",
  "UNKNOWN",
]);

export type SoloSeatStatus = z.infer<typeof soloSeatStatusSchema>;

export const searchRestaurantsInputSchema = z.object({
  category: z.string().optional(),
  district: z.string().optional(),
  keyword: z.string().optional(),
  city: z.string().default("台中市"),
  soloSeatOnly: z.boolean().default(false),
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
  soloSeatStatus: SoloSeatStatus;
  soloSeatType: string | null;
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
};
