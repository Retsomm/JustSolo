import { findRestaurantById, findRestaurants } from "@/server/clients/prismaClient";
import type {
  PaginatedRestaurants,
  RestaurantDetail,
  RestaurantFilterInput,
  RestaurantMapMarker,
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

// 共用組合層：呼叫 Client 拿資料、套用篩選/排序，清單（分頁）跟地圖（不分頁）都靠這個
// 函式取得同一份「篩選後」的結果，避免兩處各自組 Client 參數導致漏傳篩選欄位。
const fetchFilteredRestaurants = async (
  input: RestaurantFilterInput,
): Promise<RestaurantSearchResult[]> => {
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

// 純函式：把篩選後的餐廳清單轉成地圖 marker 需要的形狀，濾掉沒有座標的資料。
export const toMapMarkers = (
  restaurants: RestaurantSearchResult[],
): RestaurantMapMarker[] =>
  restaurants
    .filter(
      (r): r is RestaurantSearchResult & { lat: number; lng: number } =>
        r.lat !== null && r.lng !== null,
    )
    .map((r) => ({
      id: r.id,
      name: r.name,
      lat: r.lat,
      lng: r.lng,
      soloSeatStatus: r.soloSeatStatus,
    }));

// 組合層：跟 searchRestaurants 共用同一個篩選步驟，但不分頁、回傳地圖 marker 形狀。
export const getRestaurantMapMarkers = async (
  input: RestaurantFilterInput,
): Promise<RestaurantMapMarker[]> => {
  const filtered = await fetchFilteredRestaurants(input);
  return toMapMarkers(filtered);
};

// 純粹轉呼叫 Client 層，沒有額外業務邏輯，故不另立單元測試。
export const getRestaurantById = (id: string): Promise<RestaurantDetail | null> =>
  findRestaurantById(id);
