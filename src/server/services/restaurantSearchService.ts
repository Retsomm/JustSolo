import { findRestaurantById, findRestaurants } from "@/server/clients/prismaClient";
import { paginate } from "@/lib/pagination";
import type {
  PaginatedRestaurants,
  RestaurantDetail,
  RestaurantFilterInput,
  RestaurantMapMarker,
  RestaurantSearchResult,
  RestaurantSearchResultWithFriendliness,
  SearchRestaurantsInput,
  SoloFriendliness,
  SoloSeatStatus,
} from "@/types/restaurant";

export const RESTAURANT_PAGE_SIZE = 10;

// 「單人用餐友善度」分數的標籤門檻，由高到低。CONFIRMED_YES 落在 70-100、
// UNKNOWN 落在 40-45、CONFIRMED_NO 落在 0-20，門檻刻意抓在各區間之間，
// 分數排序時三種狀態的群組順序（YES > UNKNOWN > NO）不會被打亂。
export const resolveSoloFriendlinessLabel = (score: number): string => {
  if (score >= 85) return "非常適合單人";
  if (score >= 65) return "適合單人";
  if (score >= 35) return "未知，建議致電確認";
  return "不建議單人前往";
};

// 純函式：把單人座位狀態/信心分數/座位類型描述換算成一個 0-100 的友善度分數。
// CONFIRMED_YES：底分 70 + 信心分數貢獻最多 30 分；CONFIRMED_NO：信心分數越高分數越低
// （越確定沒有單人座位越不友善）；UNKNOWN：固定中段分數。三種狀態都有
// soloSeatType（座位類型描述）的加分，代表已知的具體資訊越多越有參考價值。
export const computeSoloFriendlinessScore = (input: {
  soloSeatStatus: SoloSeatStatus;
  soloSeatConfidence: number;
  soloSeatType: string | null;
}): SoloFriendliness => {
  const typeBonus = input.soloSeatType ? 5 : 0;

  const rawScore = (() => {
    switch (input.soloSeatStatus) {
      case "CONFIRMED_YES":
        return 70 + Math.round(input.soloSeatConfidence * 30) + typeBonus;
      case "CONFIRMED_NO":
        return Math.round((1 - input.soloSeatConfidence) * 20);
      case "UNKNOWN":
        return 40 + typeBonus;
    }
  })();

  const score = Math.min(100, Math.max(0, rawScore));

  return {
    soloFriendlinessScore: score,
    soloFriendlinessLabel: resolveSoloFriendlinessLabel(score),
  };
};

// 純函式：不碰 DB，只針對已取得的清單做篩選/排序，並附上算好的友善度分數，
// 方便單元測試。依友善度分數由高到低排序——因為三種 soloSeatStatus 對應的
// 分數區間不重疊，群組順序（CONFIRMED_YES > UNKNOWN > CONFIRMED_NO）維持
// 不變，只是同一狀態內會依信心分數/座位類型細分排序。
export const filterAndSortBySoloSeat = (
  restaurants: RestaurantSearchResult[],
  soloSeatOnly: boolean,
): RestaurantSearchResultWithFriendliness[] => {
  const filtered = soloSeatOnly
    ? restaurants.filter((r) => r.soloSeatStatus === "CONFIRMED_YES")
    : restaurants;

  const withFriendliness = filtered.map((r) => ({
    ...r,
    ...computeSoloFriendlinessScore(r),
  }));

  return withFriendliness.sort((a, b) => {
    const scoreDiff = b.soloFriendlinessScore - a.soloFriendlinessScore;
    return scoreDiff !== 0 ? scoreDiff : a.id.localeCompare(b.id);
  });
};

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

// 組合層：呼叫 Client 拿原始詳情，補上算好的友善度分數（Client 層只回傳
// I/O 原始欄位，不含業務邏輯）。
export const getRestaurantById = async (
  id: string,
): Promise<RestaurantDetail | null> => {
  const restaurant = await findRestaurantById(id);
  if (!restaurant) return null;

  return { ...restaurant, ...computeSoloFriendlinessScore(restaurant) };
};
