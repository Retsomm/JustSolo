import { z } from "zod";

// Google Places API (New) — Text Search
// https://developers.google.com/maps/documentation/places/web-service/text-search
const PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACES_FIELD_MASK = "places.id,places.displayName,places.formattedAddress,places.location";

export type PlaceSearchResult = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

const placesResponseSchema = z.object({
  places: z
    .array(
      z.object({
        id: z.string(),
        displayName: z.object({ text: z.string() }),
        formattedAddress: z.string(),
        location: z.object({ latitude: z.number(), longitude: z.number() }),
      }),
    )
    .optional(),
});

// 純函式：組出搜尋字串，方便單元測試，不用真的打 API。
export const buildTextSearchQuery = (category: string, city: string): string =>
  `${city}${category}`;

// 純函式：把 Google Places API 回應轉成內部型別，方便單元測試 mock 回應內容。
export const parsePlacesResponse = (json: unknown): PlaceSearchResult[] => {
  const parsed = placesResponseSchema.parse(json);

  return (parsed.places ?? []).map((place) => ({
    placeId: place.id,
    name: place.displayName.text,
    address: place.formattedAddress,
    lat: place.location.latitude,
    lng: place.location.longitude,
  }));
};

// 組合層：呼叫 Google Places API，需要 GOOGLE_PLACES_API_KEY。
export const searchPlacesByCategory = async (
  category: string,
  city: string,
): Promise<PlaceSearchResult[]> => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("缺少 GOOGLE_PLACES_API_KEY，請先在 .env 設定");
  }

  const response = await fetch(PLACES_TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": PLACES_FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: buildTextSearchQuery(category, city),
      languageCode: "zh-TW",
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Google Places API 回應錯誤：${response.status} ${response.statusText}`,
    );
  }

  return parsePlacesResponse(await response.json());
};
