import { findRestaurants } from "@/server/clients/prismaClient";
import type {
  PaginatedRestaurants,
  RestaurantSearchResult,
  SearchRestaurantsInput,
  SoloSeatStatus,
} from "@/types/restaurant";

export const RESTAURANT_PAGE_SIZE = 10;

const soloSeatSortOrder: Record<SoloSeatStatus, number> = {
  CONFIRMED_YES: 0,
  UNKNOWN: 1,
  CONFIRMED_NO: 2,
};

// 純函式：不碰 DB，只針對已取得的清單做篩選/排序，方便單元測試。
export const filterAndSortBySoloSeat = (
  restaurants: RestaurantSearchResult[],
  soloSeatOnly: boolean,
): RestaurantSearchResult[] => {
  const filtered = soloSeatOnly
    ? restaurants.filter((r) => r.soloSeatStatus === "CONFIRMED_YES")
    : restaurants;

  return [...filtered].sort((a, b) => {
    const statusDiff =
      soloSeatSortOrder[a.soloSeatStatus] - soloSeatSortOrder[b.soloSeatStatus];
    return statusDiff !== 0 ? statusDiff : a.id.localeCompare(b.id);
  });
};

// 純函式：把已排序好的清單切成單一頁，並算出分頁需要的中繼資料，方便單元測試。
export const paginate = <T>(
  items: T[],
  page: number,
  pageSize: number,
): { items: T[]; page: number; pageSize: number; totalCount: number; totalPages: number } => {
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    totalCount,
    totalPages,
  };
};

// 組合層：呼叫 Client 拿資料，套用篩選/排序，再切成單一頁回傳。
export const searchRestaurants = async (
  input: SearchRestaurantsInput,
): Promise<PaginatedRestaurants> => {
  const restaurants = await findRestaurants({
    category: input.category,
    city: input.city,
  });

  const filtered = filterAndSortBySoloSeat(restaurants, input.soloSeatOnly);
  return paginate(filtered, input.page, RESTAURANT_PAGE_SIZE);
};
