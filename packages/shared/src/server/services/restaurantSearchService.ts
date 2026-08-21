import { findRestaurantById, findRestaurants } from "../clients/prismaClient";
import { paginate } from "../../pure/pagination";
import {
  RESTAURANT_PAGE_SIZE,
  computeSoloFriendlinessScore,
  filterAndSortBySoloSeat,
  pickRandom,
  toMapMarkers,
} from "../../pure/restaurantFriendliness";
import type {
  PaginatedRestaurants,
  PickRestaurantInput,
  RestaurantDetail,
  RestaurantFilterInput,
  RestaurantMapMarker,
  RestaurantPick,
  SearchRestaurantsInput,
  RestaurantSearchResultWithFriendliness,
} from "../../types/restaurant";

// 共用組合層：呼叫 Client 拿資料、套用篩選/排序，清單（分頁）跟地圖（不分頁）都靠這個
// 函式取得同一份「篩選後」的結果，避免兩處各自組 Client 參數導致漏傳篩選欄位。
const fetchFilteredRestaurants = async (
  input: RestaurantFilterInput,
): Promise<RestaurantSearchResultWithFriendliness[]> => {
  const restaurants = await findRestaurants({
    category: input.category,
    district: input.district,
    keyword: input.keyword,
    city: input.city,
  });

  return filterAndSortBySoloSeat(restaurants, input.soloSeatOnly);
};

// 組合層：呼叫 Client 拿資料，套用篩選/排序，再切成單一頁回傳。
export const searchRestaurants = async (
  input: SearchRestaurantsInput,
): Promise<PaginatedRestaurants> => {
  const filtered = await fetchFilteredRestaurants(input);
  return paginate(filtered, input.page, RESTAURANT_PAGE_SIZE);
};

// 組合層：跟 searchRestaurants 共用同一個篩選步驟，但不分頁、回傳地圖 marker 形狀。
export const getRestaurantMapMarkers = async (
  input: RestaurantFilterInput,
): Promise<RestaurantMapMarker[]> => {
  const filtered = await fetchFilteredRestaurants(input);
  return toMapMarkers(filtered);
};

// 組合層：跟 searchRestaurants/getRestaurantMapMarkers 共用同一個篩選步驟，
// 從篩選後的結果隨機挑一筆（首頁「換一家」用），不把整份清單送到瀏覽器，
// 只回傳挑中的一筆＋篩選後的總數（給「查看完整列表（N 家）」文案用）。
export const pickRandomRestaurant = async (
  input: PickRestaurantInput,
): Promise<RestaurantPick> => {
  const filtered = await fetchFilteredRestaurants(input);
  return {
    restaurant: pickRandom(filtered, input.excludeIds),
    totalCount: filtered.length,
  };
};

// 組合層：呼叫 Client 拿原始詳情，補上算好的友善度分數（Client 層只回傳
// I/O 原始欄位，不含業務邏輯）。
export const getRestaurantById = async (
  id: string,
): Promise<RestaurantDetail | null> => {
  const restaurant = await findRestaurantById(id);
  if (!restaurant) return null;

  return { ...restaurant, ...computeSoloFriendlinessScore(restaurant) };
};
