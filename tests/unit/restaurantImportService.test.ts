import { describe, expect, it } from "vitest";
import {
  toRestaurantUpsertInput,
  filterPlacesInTaichung,
} from "@/server/services/restaurantImportService";
import type { PlaceSearchResult } from "@/server/clients/placesClient";

describe("toRestaurantUpsertInput", () => {
  it("把 Places 搜尋結果轉成 DB upsert 需要的資料", () => {
    const place: PlaceSearchResult = {
      placeId: "place-1",
      name: "測試燒肉店",
      address: "台中市西區某路 1 號",
      lat: 24.15,
      lng: 120.67,
      categoryName: "燒烤餐廳",
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

describe("filterPlacesInTaichung", () => {
  it("排除座標落在台中市範圍外的地點", () => {
    const inTaichung: PlaceSearchResult = {
      placeId: "place-1",
      name: "台中市內的店",
      address: "台中市西區某路 1 號",
      lat: 24.15,
      lng: 120.67,
      categoryName: "燒烤餐廳",
    };
    const inTaipei: PlaceSearchResult = {
      placeId: "place-2",
      name: "地址寫台中市但座標在台北市的店",
      address: "台中市西區某路 2 號",
      lat: 25.03,
      lng: 121.56,
      categoryName: "其他",
    };

    expect(filterPlacesInTaichung([inTaichung, inTaipei])).toEqual([inTaichung]);
  });
});
