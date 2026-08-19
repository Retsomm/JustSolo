import { describe, expect, it } from "vitest";
import {
  toRestaurantUpsertInput,
  filterPlacesInTaichung,
  buildDistrictAreas,
  TAICHUNG_DISTRICTS,
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
      phone: "04-1234 5678",
    };

    expect(
      toRestaurantUpsertInput(place, "category-1", "台中市", "西區"),
    ).toEqual({
      placeId: "place-1",
      name: "測試燒肉店",
      address: "台中市西區某路 1 號",
      lat: 24.15,
      lng: 120.67,
      phone: "04-1234 5678",
      district: "西區",
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
      phone: null,
    };
    const inTaipei: PlaceSearchResult = {
      placeId: "place-2",
      name: "地址寫台中市但座標在台北市的店",
      address: "台中市西區某路 2 號",
      lat: 25.03,
      lng: 121.56,
      categoryName: "其他",
      phone: null,
    };

    expect(filterPlacesInTaichung([inTaichung, inTaipei])).toEqual([inTaichung]);
  });
});

describe("buildDistrictAreas", () => {
  it("把城市名稱跟每個行政區組成搜尋字串", () => {
    const areas = buildDistrictAreas("台中市");

    expect(areas).toHaveLength(TAICHUNG_DISTRICTS.length);
    expect(areas[0]).toBe("台中市中區");
    expect(areas).toContain("台中市西屯區");
    expect(areas).toContain("台中市大安區");
  });
});
