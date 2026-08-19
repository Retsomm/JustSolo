import { describe, expect, it } from "vitest";
import {
  buildTextSearchQuery,
  parsePlacesResponse,
} from "@/server/clients/placesClient";

describe("buildTextSearchQuery", () => {
  it("把城市跟分類組成搜尋字串", () => {
    expect(buildTextSearchQuery("燒肉", "台中市")).toBe("台中市燒肉");
  });
});

describe("parsePlacesResponse", () => {
  it("把 Google Places API 回應轉成內部型別", () => {
    const response = {
      places: [
        {
          id: "place-1",
          displayName: { text: "測試燒肉店" },
          formattedAddress: "台中市西區某路 1 號",
          location: { latitude: 24.15, longitude: 120.67 },
        },
      ],
    };

    expect(parsePlacesResponse(response)).toEqual([
      {
        placeId: "place-1",
        name: "測試燒肉店",
        address: "台中市西區某路 1 號",
        lat: 24.15,
        lng: 120.67,
      },
    ]);
  });

  it("回應沒有 places 欄位時回傳空陣列", () => {
    expect(parsePlacesResponse({})).toEqual([]);
  });

  it("回應格式不符合預期時丟出錯誤", () => {
    expect(() => parsePlacesResponse({ places: [{ id: "只有 id" }] })).toThrow();
  });
});
