import { findRestaurants } from "@/server/clients/prismaClient";
import type {
  RestaurantSearchResult,
  SearchRestaurantsInput,
  SoloSeatStatus,
} from "@/types/restaurant";

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

  return [...filtered].sort(
    (a, b) =>
      soloSeatSortOrder[a.soloSeatStatus] - soloSeatSortOrder[b.soloSeatStatus],
  );
};

// 組合層：呼叫 Client 拿資料，再套用上面的純函式業務邏輯。
export const searchRestaurants = async (
  input: SearchRestaurantsInput,
): Promise<RestaurantSearchResult[]> => {
  const restaurants = await findRestaurants({
    category: input.category,
    city: input.city,
  });

  return filterAndSortBySoloSeat(restaurants, input.soloSeatOnly);
};
