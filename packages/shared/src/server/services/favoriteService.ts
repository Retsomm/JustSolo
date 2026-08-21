import {
  addFavorite,
  findFavoriteByUserAndRestaurant,
  listFavoriteRestaurantsByUserId,
  removeFavorite,
} from "../clients/prismaClient";
import {
  RESTAURANT_PAGE_SIZE,
  computeSoloFriendlinessScore,
} from "../../pure/restaurantFriendliness";
import type { PaginatedRestaurants } from "../../types/restaurant";

// 組合層：直接依前端傳入的「目標狀態」寫入，不再「先讀現況、反向切換」。
// addFavorite（upsert）/ removeFavorite（deleteMany）在 Client 層本身就是
// idempotent 操作，同一個目標狀態被重複呼叫（使用者連點、或請求重試造成的
// 重複請求）結果都一樣；先前 read-then-toggle 的寫法遇到並行請求時，兩個
// 請求各自讀到同一個現況值、各自反轉，會算出互相矛盾的下一狀態。
export const toggleFavorite = async (
  userId: string,
  restaurantId: string,
  isFavorited: boolean,
): Promise<{ isFavorited: boolean }> => {
  if (isFavorited) {
    await addFavorite(userId, restaurantId);
  } else {
    await removeFavorite(userId, restaurantId);
  }

  return { isFavorited };
};

export const checkIsFavorited = (
  userId: string,
  restaurantId: string,
): Promise<boolean> => findFavoriteByUserAndRestaurant(userId, restaurantId);

// 組合層：跟 restaurantSearchService 的 searchRestaurants 一樣，Client 層只回傳
// 原始欄位，友善度分數留在 Service 層算好才回傳；分頁則交給 Client 層在 DB
// 層做（收藏筆數多時不需要每次整批撈進記憶體），這裡只把分頁後的那一頁結果
// 補上友善度分數。
export const listFavoriteRestaurants = async (
  userId: string,
  page: number,
): Promise<PaginatedRestaurants> => {
  const { items, totalCount, page: safePage, totalPages } =
    await listFavoriteRestaurantsByUserId(userId, page, RESTAURANT_PAGE_SIZE);

  return {
    items: items.map((r) => ({ ...r, ...computeSoloFriendlinessScore(r) })),
    page: safePage,
    pageSize: RESTAURANT_PAGE_SIZE,
    totalCount,
    totalPages,
  };
};
