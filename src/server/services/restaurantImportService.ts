import {
  searchRestaurantsInCity,
  isWithinTaichung,
  type PlaceSearchResult,
} from "@/server/clients/placesClient";
import {
  findOrCreateCategory,
  upsertRestaurantByPlaceId,
  type RestaurantUpsertInput,
} from "@/server/clients/prismaClient";

// 純函式：把一筆 Places 搜尋結果轉成 DB upsert 需要的資料，方便單元測試。
export const toRestaurantUpsertInput = (
  place: PlaceSearchResult,
  categoryId: string,
  city: string,
): RestaurantUpsertInput => ({
  placeId: place.placeId,
  name: place.name,
  address: place.address,
  lat: place.lat,
  lng: place.lng,
  city,
  categoryId,
});

// 純函式：排除座標落在台中市範圍外的地點（locationRestriction 已經限制過一次，
// 這裡是寫入 DB 前的第二道防線），方便單元測試。
export const filterPlacesInTaichung = (
  places: PlaceSearchResult[],
): PlaceSearchResult[] => places.filter((place) => isWithinTaichung(place.lat, place.lng));

// 組合層：廣泛搜尋整個城市的餐廳並寫入 DB，分類直接採用 Google Places 回傳的
// 實際類型（不是預先決定的固定清單），回傳匯入筆數。
export const importCityRestaurants = async (city: string): Promise<number> => {
  const searchResults = await searchRestaurantsInCity(city);
  const places = filterPlacesInTaichung(searchResults);

  for (const place of places) {
    const dbCategory = await findOrCreateCategory(place.categoryName);
    await upsertRestaurantByPlaceId(
      toRestaurantUpsertInput(place, dbCategory.id, city),
    );
  }

  return places.length;
};
