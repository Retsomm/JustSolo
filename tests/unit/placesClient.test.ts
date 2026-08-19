import { describe, expect, it } from "vitest";
import {
  buildTextSearchQuery,
  parsePlacesResponse,
  isWithinTaichung,
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
