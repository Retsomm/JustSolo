import {
  searchPlacesByCategory,
  type PlaceSearchResult,
} from "@/server/clients/placesClient";
import {
  findOrCreateCategory,
  upsertRestaurantByPlaceId,
  type RestaurantUpsertInput,
} from "@/server/clients/prismaClient";

export const TAICHUNG_IMPORT_CATEGORIES = ["燒肉", "中式", "牛排", "甜點"] as const;

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

// 組合層：對單一分類，抓 Places 資料並寫入 DB，回傳匯入筆數。
export const importCategoryRestaurants = async (
  category: string,
  city: string,
): Promise<number> => {
  const places = await searchPlacesByCategory(category, city);
  const dbCategory = await findOrCreateCategory(category);

  for (const place of places) {
    await upsertRestaurantByPlaceId(
      toRestaurantUpsertInput(place, dbCategory.id, city),
    );
  }

  return places.length;
};
