import { describe, expect, it } from "vitest";
import {
  buildPlacePhotoMediaUrl,
  buildTextSearchQuery,
  isValidPlacePhotoName,
  isWithinTaichung,
  parsePlaceDetailsResponse,
  parsePlacesResponse,
} from "@/server/clients/placesClient";

describe("buildTextSearchQuery", () => {
  it("組出不限分類的廣泛搜尋字串", () => {
    expect(buildTextSearchQuery("台中市")).toBe("台中市餐廳");
  });
});

describe("parsePlacesResponse", () => {
  it("把 Google Places API 回應轉成內部型別，分類採用 Google 回傳的 primaryTypeDisplayName", () => {
    const response = {
      places: [
        {
          id: "place-1",
          displayName: { text: "測試燒肉店" },
          formattedAddress: "台中市西區某路 1 號",
          location: { latitude: 24.15, longitude: 120.67 },
          primaryType: "barbecue_restaurant",
          primaryTypeDisplayName: { text: "燒烤餐廳" },
          nationalPhoneNumber: "04-1234 5678",
        },
      ],
      nextPageToken: "token-abc",
    };

    expect(parsePlacesResponse(response)).toEqual({
      results: [
        {
          placeId: "place-1",
          name: "測試燒肉店",
          address: "台中市西區某路 1 號",
          lat: 24.15,
          lng: 120.67,
          categoryName: "燒烤餐廳",
          phone: "04-1234 5678",
        },
      ],
      nextPageToken: "token-abc",
    });
  });

  it("沒有電話號碼時 phone 是 null", () => {
    const response = {
      places: [
        {
          id: "place-no-phone",
          displayName: { text: "沒有電話的店" },
          formattedAddress: "台中市某路 9 號",
          location: { latitude: 24.1, longitude: 120.6 },
        },
      ],
    };

    expect(parsePlacesResponse(response).results[0].phone).toBeNull();
  });

  it("沒有 primaryTypeDisplayName 時退回 primaryType，兩者都沒有時退回「其他」", () => {
    const response = {
      places: [
        {
          id: "place-2",
          displayName: { text: "只有 primaryType 的店" },
          formattedAddress: "台中市某路 2 號",
          location: { latitude: 24.1, longitude: 120.6 },
          primaryType: "steak_house",
        },
        {
          id: "place-3",
          displayName: { text: "完全沒有類型的店" },
          formattedAddress: "台中市某路 3 號",
          location: { latitude: 24.2, longitude: 120.7 },
        },
      ],
    };

    const { results } = parsePlacesResponse(response);

    expect(results[0].categoryName).toBe("steak_house");
    expect(results[1].categoryName).toBe("其他");
  });

  it("回應沒有 places 欄位時回傳空陣列", () => {
    expect(parsePlacesResponse({})).toEqual({ results: [], nextPageToken: undefined });
  });

  it("回應格式不符合預期時丟出錯誤", () => {
    expect(() =>
      parsePlacesResponse({ places: [{ id: "只有 id" }] }),
    ).toThrow();
  });
});

describe("isWithinTaichung", () => {
  it("台中市區內的座標回傳 true", () => {
    expect(isWithinTaichung(24.15, 120.67)).toBe(true);
  });

  it("台北市的座標回傳 false", () => {
    expect(isWithinTaichung(25.03, 121.56)).toBe(false);
  });

  it("剛好落在邊界上的座標回傳 true", () => {
    expect(isWithinTaichung(23.95, 120.45)).toBe(true);
    expect(isWithinTaichung(24.45, 121.45)).toBe(true);
  });
});

describe("parsePlaceDetailsResponse", () => {
  // 欄位形狀已用真實 placeId 實測過 Google Place Details API 確認過一次，
  // 這裡的 fixture 照實測回應簡化而來（見 PROGRESS.md）。
  it("把完整的 Google Place Details 回應轉成內部型別", () => {
    const response = {
      id: "place-1",
      rating: 4.8,
      userRatingCount: 5001,
      priceLevel: "PRICE_LEVEL_MODERATE",
      regularOpeningHours: {
        weekdayDescriptions: ["星期一: 10:00 – 21:00"],
      },
      websiteUri: "https://example.com",
      googleMapsUri: "https://maps.google.com/?cid=123",
      editorialSummary: { text: "裝潢低調的愜意餐廳" },
      photos: [{ name: "places/place-1/photos/photo-1", widthPx: 3022, heightPx: 3605 }],
      reviews: [
        {
          rating: 5,
          relativePublishTimeDescription: "3 個月前",
          text: { text: "東西好吃" },
          authorAttribution: {
            displayName: "小黃魚",
            uri: "https://www.google.com/maps/contrib/123",
          },
        },
      ],
    };

    expect(parsePlaceDetailsResponse(response, "place-1")).toEqual({
      rating: 4.8,
      userRatingCount: 5001,
      priceLevel: "PRICE_LEVEL_MODERATE",
      openingHours: ["星期一: 10:00 – 21:00"],
      websiteUri: "https://example.com",
      googleMapsUri: "https://maps.google.com/?cid=123",
      editorialSummary: "裝潢低調的愜意餐廳",
      photos: [{ name: "places/place-1/photos/photo-1", widthPx: 3022, heightPx: 3605 }],
      reviews: [
        {
          authorName: "小黃魚",
          authorUri: "https://www.google.com/maps/contrib/123",
          rating: 5,
          relativeTime: "3 個月前",
          text: "東西好吃",
        },
      ],
    });
  });

  it("Google 沒回 googleMapsUri 時，用 placeId 組一個 fallback 連結", () => {
    const result = parsePlaceDetailsResponse({ id: "place-2" }, "place-2");

    expect(result.googleMapsUri).toBe(
      "https://www.google.com/maps/place/?q=place_id:place-2",
    );
  });

  it("欄位都缺席時，回傳空陣列/null，不會丟錯", () => {
    expect(parsePlaceDetailsResponse({ id: "place-3" }, "place-3")).toEqual({
      rating: null,
      userRatingCount: null,
      priceLevel: null,
      openingHours: null,
      websiteUri: null,
      googleMapsUri: "https://www.google.com/maps/place/?q=place_id:place-3",
      editorialSummary: null,
      photos: [],
      reviews: [],
    });
  });

  it("評論沒有 authorAttribution 時，作者顯示為「匿名使用者」", () => {
    const result = parsePlaceDetailsResponse(
      { id: "place-4", reviews: [{ rating: 3 }] },
      "place-4",
    );

    expect(result.reviews[0]).toEqual({
      authorName: "匿名使用者",
      authorUri: null,
      rating: 3,
      relativeTime: null,
      text: null,
    });
  });
});

describe("isValidPlacePhotoName", () => {
  it("合法的 photo resource name 回傳 true", () => {
    expect(isValidPlacePhotoName("places/ChIJabc/photos/AVoN123")).toBe(true);
  });

  it("不合法的格式回傳 false", () => {
    expect(isValidPlacePhotoName("not-a-photo-name")).toBe(false);
    expect(isValidPlacePhotoName("places/ChIJabc/photos/")).toBe(false);
    expect(isValidPlacePhotoName("https://evil.com/steal-key")).toBe(false);
    expect(isValidPlacePhotoName("places/ChIJabc/photos/a/b")).toBe(false);
  });
});

describe("buildPlacePhotoMediaUrl", () => {
  it("組出帶 maxWidthPx 與 API Key 的 Google Photo Media 網址", () => {
    expect(
      buildPlacePhotoMediaUrl("places/ChIJabc/photos/AVoN123", 200, "test-key"),
    ).toBe(
      "https://places.googleapis.com/v1/places/ChIJabc/photos/AVoN123/media?maxWidthPx=200&key=test-key",
    );
  });
});
