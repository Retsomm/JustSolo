import {
  searchRestaurantsInArea,
  isWithinTaichung,
  type PlaceSearchResult,
} from "@/server/clients/placesClient";
import {
  findOrCreateCategory,
  upsertRestaurantByPlaceId,
  type RestaurantUpsertInput,
} from "@/server/clients/prismaClient";

// 台中市轄下 29 個行政區。Google Places Text Search 對單一查詢字串
// （例如「台中市餐廳」）約有 60 筆結果的硬上限，就算調高分頁也一樣——
// 逐區查詢（「台中市西區餐廳」「台中市北屯區餐廳」…）才能突破這個限制，
// 覆蓋面才會接近城市內實際的餐廳數量。
export const TAICHUNG_DISTRICTS = [
  "中區",
  "東區",
  "南區",
  "西區",
  "北區",
  "北屯區",
  "西屯區",
  "南屯區",
  "太平區",
  "大里區",
  "霧峰區",
  "烏日區",
  "豐原區",
  "后里區",
  "石岡區",
  "東勢區",
  "和平區",
  "新社區",
  "潭子區",
  "大雅區",
  "神岡區",
  "大肚區",
  "沙鹿區",
  "龍井區",
  "梧棲區",
  "清水區",
  "大甲區",
  "外埔區",
  "大安區",
] as const;

// 純函式：把一筆 Places 搜尋結果轉成 DB upsert 需要的資料，方便單元測試。
// district 是這筆結果「來自哪個行政區查詢」（查詢字串帶入的，不是 Google Places
// 官方回傳的欄位）——Text Search 是相關性排序，不是行政區窮舉，同一筆結果可能因為
// 排名而出現在鄰近行政區的查詢裡，不能直接信任查詢來源就是這筆店家實際所在的行政區。
// 這裡用 Google 回傳的權威地址資料（place.address）反查地址字串是否真的包含這個
// 行政區名稱來驗證，驗證不過就存 null，不寫入未經驗證的行政區。
export const toRestaurantUpsertInput = (
  place: PlaceSearchResult,
  categoryId: string,
  city: string,
  district: string | null,
): RestaurantUpsertInput => ({
  placeId: place.placeId,
  name: place.name,
  address: place.address,
  lat: place.lat,
  lng: place.lng,
  phone: place.phone,
  district: district !== null && place.address.includes(district) ? district : null,
  city,
  categoryId,
});

// 純函式：排除座標落在台中市範圍外的地點（locationRestriction 已經限制過一次，
// 這裡是寫入 DB 前的第二道防線），方便單元測試。
export const filterPlacesInTaichung = (
  places: PlaceSearchResult[],
): PlaceSearchResult[] => places.filter((place) => isWithinTaichung(place.lat, place.lng));

// 純函式：把城市名稱組成每個行政區各自的搜尋字串，方便單元測試。
export const buildDistrictAreas = (city: string): string[] =>
  TAICHUNG_DISTRICTS.map((district) => `${city}${district}`);

// 組合層：逐區搜尋整個城市的餐廳並寫入 DB，分類直接採用 Google Places 回傳的
// 實際類型（不是預先決定的固定清單）。用 placeId 去重，避免同一間店在不同
// 行政區查詢中重複出現時被重複計數，回傳實際匯入的筆數。
export const importCityRestaurants = async (
  city: string,
  onAreaComplete?: (area: string, importedInArea: number) => void,
): Promise<number> => {
  const seenPlaceIds = new Set<string>();
  let importedCount = 0;

  for (const district of TAICHUNG_DISTRICTS) {
    const area = `${city}${district}`;
    const searchResults = await searchRestaurantsInArea(area);
    const places = filterPlacesInTaichung(searchResults);
    let importedInArea = 0;

    for (const place of places) {
      if (seenPlaceIds.has(place.placeId)) continue;
      seenPlaceIds.add(place.placeId);

      const dbCategory = await findOrCreateCategory(place.categoryName);
      await upsertRestaurantByPlaceId(
        toRestaurantUpsertInput(place, dbCategory.id, city, district),
      );
      importedCount += 1;
      importedInArea += 1;
    }

    onAreaComplete?.(area, importedInArea);
  }

  return importedCount;
};
