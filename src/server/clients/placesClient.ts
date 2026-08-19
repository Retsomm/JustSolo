import { z } from "zod";

// Google Places API (New) — Text Search
// https://developers.google.com/maps/documentation/places/web-service/text-search
const PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACES_FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.primaryTypeDisplayName,nextPageToken";

// 分類不是我們自己預先決定的固定清單，而是每筆結果直接採用 Google Places
// 回傳的 primaryTypeDisplayName（找不到時退回 primaryType 或「其他」），
// 這樣分類會自然涵蓋 Google Map 上實際出現的所有餐廳類型。
export type PlaceSearchResult = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  categoryName: string;
};

export type PlaceSearchPage = {
  results: PlaceSearchResult[];
  nextPageToken?: string;
};

// 台中市大致地理範圍的矩形近似（涵蓋市區到和平區山地），
// 用於 Places API 的 locationRestriction 與匯入時的座標過濾，
// 避免文字比對到行政區範圍外、但地址仍含「台中市」字樣的地點。
export const TAICHUNG_BOUNDS = {
  south: 23.95,
  north: 24.45,
  west: 120.45,
  east: 121.45,
};

// 純函式：座標是否落在台中市大致範圍內，方便單元測試。
export const isWithinTaichung = (lat: number, lng: number): boolean =>
  lat >= TAICHUNG_BOUNDS.south &&
  lat <= TAICHUNG_BOUNDS.north &&
  lng >= TAICHUNG_BOUNDS.west &&
  lng <= TAICHUNG_BOUNDS.east;

const placesResponseSchema = z.object({
  places: z
    .array(
      z.object({
        id: z.string(),
        displayName: z.object({ text: z.string() }),
        formattedAddress: z.string(),
        location: z.object({ latitude: z.number(), longitude: z.number() }),
        primaryType: z.string().optional(),
        primaryTypeDisplayName: z.object({ text: z.string() }).optional(),
      }),
    )
    .optional(),
  nextPageToken: z.string().optional(),
});

// 純函式：組出廣泛的搜尋字串（不綁定特定分類），方便單元測試，不用真的打 API。
export const buildTextSearchQuery = (city: string): string => `${city}餐廳`;

// 純函式：把 Google Places API 回應轉成內部型別，方便單元測試 mock 回應內容。
export const parsePlacesResponse = (json: unknown): PlaceSearchPage => {
  const parsed = placesResponseSchema.parse(json);

  const results = (parsed.places ?? []).map((place) => ({
    placeId: place.id,
    name: place.displayName.text,
    address: place.formattedAddress,
    lat: place.location.latitude,
    lng: place.location.longitude,
    categoryName: place.primaryTypeDisplayName?.text ?? place.primaryType ?? "其他",
  }));

  return { results, nextPageToken: parsed.nextPageToken };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchPlacesPage = async (
  query: string,
  pageToken: string | undefined,
  apiKey: string,
): Promise<PlaceSearchPage> => {
  const response = await fetch(PLACES_TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": PLACES_FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "zh-TW",
      locationRestriction: {
        rectangle: {
          low: { latitude: TAICHUNG_BOUNDS.south, longitude: TAICHUNG_BOUNDS.west },
          high: { latitude: TAICHUNG_BOUNDS.north, longitude: TAICHUNG_BOUNDS.east },
        },
      },
      ...(pageToken ? { pageToken } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Google Places API 回應錯誤：${response.status} ${response.statusText}`,
    );
  }

  return parsePlacesResponse(await response.json());
};

// 組合層：呼叫 Google Places API，用廣泛查詢字串（不是預先決定的分類清單）
// 搭配分頁抓多頁結果，讓匯入的餐廳分類直接反映 Google Map 上實際存在的類型。
// 需要 GOOGLE_PLACE_NEW_API_KEY。
export const searchRestaurantsInCity = async (
  city: string,
  maxPages = 3,
): Promise<PlaceSearchResult[]> => {
  const apiKey = process.env.GOOGLE_PLACE_NEW_API_KEY;
  if (!apiKey) {
    throw new Error("缺少 GOOGLE_PLACE_NEW_API_KEY，請先在 .env 設定");
  }

  const query = buildTextSearchQuery(city);
  const allResults: PlaceSearchResult[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < maxPages; page += 1) {
    if (page > 0) {
      // Places API 分頁的 pageToken 需要短暫延遲才會生效。
      await sleep(2000);
    }

    const { results, nextPageToken } = await fetchPlacesPage(
      query,
      pageToken,
      apiKey,
    );
    allResults.push(...results);

    if (!nextPageToken) break;
    pageToken = nextPageToken;
  }

  return allResults;
};
