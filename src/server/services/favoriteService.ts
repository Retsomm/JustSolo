import {
  addFavorite,
  findFavoriteByUserAndRestaurant,
  listFavoriteRestaurantsByUserId,
  removeFavorite,
} from "@/server/clients/prismaClient";
import { computeSoloFriendlinessScore } from "@/server/services/restaurantSearchService";
import type { RestaurantSearchResultWithFriendliness } from "@/types/restaurant";

// 組合層：先查目前是否已收藏，反向切換並回傳新狀態。收藏是使用者自己對自己資料
// 的操作（不像 SoloSeatReport 是多人共用同一份 aggregate），並行風險僅限於
// 同一使用者連續點擊，交給前端 disable 按鈕處理即可，不需要比照
// submitSoloSeatReportTransaction 額外包 row lock。
export const toggleFavorite = async (
  userId: string,
  restaurantId: string,
): Promise<{ isFavorited: boolean }> => {
  const isFavorited = await findFavoriteByUserAndRestaurant(
    userId,
    restaurantId,
  );

  if (isFavorited) {
    await removeFavorite(userId, restaurantId);
    return { isFavorited: false };
  }

  await addFavorite(userId, restaurantId);
  return { isFavorited: true };
};

export const checkIsFavorited = (
  userId: string,
  restaurantId: string,
): Promise<boolean> => findFavoriteByUserAndRestaurant(userId, restaurantId);

// 組合層：跟 restaurantSearchService 的 searchRestaurants 一樣，Client 層只回傳
// 原始欄位，友善度分數留在 Service 層算好才回傳。
export const listFavoriteRestaurants = async (
  userId: string,
): Promise<RestaurantSearchResultWithFriendliness[]> => {
  const restaurants = await listFavoriteRestaurantsByUserId(userId);
  return restaurants.map((r) => ({ ...r, ...computeSoloFriendlinessScore(r) }));
};
