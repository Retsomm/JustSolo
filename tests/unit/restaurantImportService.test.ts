import { describe, expect, it } from "vitest";
import { toRestaurantUpsertInput } from "@/server/services/restaurantImportService";
import type { PlaceSearchResult } from "@/server/clients/placesClient";

describe("toRestaurantUpsertInput", () => {
  it("把 Places 搜尋結果轉成 DB upsert 需要的資料", () => {
    const place: PlaceSearchResult = {
      placeId: "place-1",
      name: "測試燒肉店",
      address: "台中市西區某路 1 號",
      lat: 24.15,
      lng: 120.67,
    };

    expect(toRestaurantUpsertInput(place, "category-1", "台中市")).toEqual({
      placeId: "place-1",
      name: "測試燒肉店",
      address: "台中市西區某路 1 號",
      lat: 24.15,
      lng: 120.67,
      city: "台中市",
      categoryId: "category-1",
    });
  });
});
