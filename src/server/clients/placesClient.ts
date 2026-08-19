// Google Places API 封裝，供 scripts/import-restaurants.ts 匯入台中市餐廳基本資料用。
// 尚未申請 GOOGLE_PLACES_API_KEY，先留介面讓 Service/Script 層可以先寫、先測。

export type PlaceSearchResult = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export const searchPlacesByCategory = async (
  _category: string,
  _city: string,
): Promise<PlaceSearchResult[]> => {
  throw new Error("placesClient 尚未實作：待申請 Google Places API Key");
};
