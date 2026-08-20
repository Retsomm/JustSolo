import { z } from "zod";

// Google Places API (New) — Text Search
// https://developers.google.com/maps/documentation/places/web-service/text-search
const PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACES_FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.primaryTypeDisplayName,places.nationalPhoneNumber,nextPageToken";

// Google Places API (New) — Place Details
// https://developers.google.com/maps/documentation/places/web-service/place-details
const PLACE_DETAILS_URL = "https://places.googleapis.com/v1/places";
const PLACE_DETAILS_FIELD_MASK =
  "id,displayName,rating,userRatingCount,priceLevel,regularOpeningHours,websiteUri,googleMapsUri,editorialSummary,photos,reviews";
const PLACE_PHOTO_MEDIA_BASE_URL = "https://places.googleapis.com/v1";

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
  phone: string | null;
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
        nationalPhoneNumber: z.string().optional(),
      }),
    )
    .optional(),
  nextPageToken: z.string().optional(),
});

// 純函式：組出廣泛的搜尋字串（不綁定特定分類），方便單元測試，不用真的打 API。
// area 可以是城市本身（"台中市"），也可以是城市+行政區（"台中市西區"）以取得更廣的覆蓋範圍——
// Google Places Text Search 對單一查詢字串約有 60 筆結果的硬上限，就算調高分頁也一樣，
// 逐區查詢才能突破這個限制、更接近城市內實際的餐廳數量。
export const buildTextSearchQuery = (area: string): string => `${area}餐廳`;

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
    phone: place.nationalPhoneNumber ?? null,
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
export const searchRestaurantsInArea = async (
  area: string,
  maxPages = 3,
): Promise<PlaceSearchResult[]> => {
  const apiKey = process.env.GOOGLE_PLACE_NEW_API_KEY;
  if (!apiKey) {
    throw new Error("缺少 GOOGLE_PLACE_NEW_API_KEY，請先在 .env 設定");
  }

  const query = buildTextSearchQuery(area);
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

// ---- Place Details（詳情頁的照片/評論/評分/營業時間/菜單連結用）----

export type PlacePhoto = {
  name: string;
  widthPx: number;
  heightPx: number;
};

export type PlaceReview = {
  authorName: string;
  authorUri: string | null;
  rating: number;
  relativeTime: string | null;
  text: string | null;
};

export type PlaceDetails = {
  rating: number | null;
  userRatingCount: number | null;
  priceLevel: string | null;
  openingHours: string[] | null;
  websiteUri: string | null;
  googleMapsUri: string;
  editorialSummary: string | null;
  photos: PlacePhoto[];
  reviews: PlaceReview[];
};

const placeDetailsResponseSchema = z.object({
  id: z.string(),
  rating: z.number().optional(),
  userRatingCount: z.number().optional(),
  priceLevel: z.string().optional(),
  regularOpeningHours: z
    .object({ weekdayDescriptions: z.array(z.string()).optional() })
    .optional(),
  websiteUri: z.string().optional(),
  googleMapsUri: z.string().optional(),
  editorialSummary: z.object({ text: z.string() }).optional(),
  photos: z
    .array(
      z.object({
        name: z.string(),
        widthPx: z.number(),
        heightPx: z.number(),
      }),
    )
    .optional(),
  reviews: z
    .array(
      z.object({
        rating: z.number(),
        relativePublishTimeDescription: z.string().optional(),
        text: z.object({ text: z.string() }).optional(),
        authorAttribution: z
          .object({
            displayName: z.string(),
            uri: z.string().optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});

// 純函式：把 Google Place Details API 回應轉成內部型別，方便單元測試 mock 回應內容。
// placeId 是呼叫端已經知道的（打 API 前就有），這裡只用來組 googleMapsUri 的 fallback——
// Google 偶爾不會回傳 googleMapsUri，這時自己組一個保證可用的連結，前端不用另外判斷。
export const parsePlaceDetailsResponse = (
  json: unknown,
  placeId: string,
): PlaceDetails => {
  const parsed = placeDetailsResponseSchema.parse(json);

  return {
    rating: parsed.rating ?? null,
    userRatingCount: parsed.userRatingCount ?? null,
    priceLevel: parsed.priceLevel ?? null,
    openingHours: parsed.regularOpeningHours?.weekdayDescriptions ?? null,
    websiteUri: parsed.websiteUri ?? null,
    googleMapsUri:
      parsed.googleMapsUri ??
      `https://www.google.com/maps/place/?q=place_id:${placeId}`,
    editorialSummary: parsed.editorialSummary?.text ?? null,
    photos: (parsed.photos ?? []).map((photo) => ({
      name: photo.name,
      widthPx: photo.widthPx,
      heightPx: photo.heightPx,
    })),
    reviews: (parsed.reviews ?? []).map((review) => ({
      authorName: review.authorAttribution?.displayName ?? "匿名使用者",
      authorUri: review.authorAttribution?.uri ?? null,
      rating: review.rating,
      relativeTime: review.relativePublishTimeDescription ?? null,
      text: review.text?.text ?? null,
    })),
  };
};

// 組合層：呼叫 Google Place Details API 拿單一地點的照片/評論/評分等資訊。
// placeId 失效（Google 回 404）時回傳 null，當成「沒有更多資訊」處理，
// 不當成硬錯誤——比照 fetchPlacesPage 的錯誤處理慣例，其他非 2xx 狀態才丟錯。
// 需要 GOOGLE_PLACE_NEW_API_KEY。
export const fetchPlaceDetails = async (
  placeId: string,
): Promise<PlaceDetails | null> => {
  const apiKey = process.env.GOOGLE_PLACE_NEW_API_KEY;
  if (!apiKey) {
    throw new Error("缺少 GOOGLE_PLACE_NEW_API_KEY，請先在 .env 設定");
  }

  const url = new URL(`${PLACE_DETAILS_URL}/${placeId}`);
  url.searchParams.set("languageCode", "zh-TW");

  const response = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": PLACE_DETAILS_FIELD_MASK,
    },
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error(
      `Google Place Details API 回應錯誤：${response.status} ${response.statusText}`,
    );
  }

  return parsePlaceDetailsResponse(await response.json(), placeId);
};

// 純函式：驗證 photo resource name 的格式（例如
// "places/ChIJ.../photos/AVoN..."），給圖片代理 route 在組 Google 網址前先擋掉
// 不合法輸入，避免變成任意網址代理（SSRF）的破口。
export const isValidPlacePhotoName = (name: string): boolean =>
  /^places\/[^/]+\/photos\/[^/]+$/.test(name);

// 純函式：組出 Google Photo Media 端點的網址（含 API Key），只給伺服器端的
// 圖片代理 route 內部呼叫，不能把組出來的網址直接交給瀏覽器（會外洩 API Key）。
export const buildPlacePhotoMediaUrl = (
  photoName: string,
  maxWidthPx: number,
  apiKey: string,
): string =>
  `${PLACE_PHOTO_MEDIA_BASE_URL}/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${apiKey}`;
