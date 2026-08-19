import { describe, expect, it } from "vitest";
import {
  toRestaurantUpsertInput,
  filterPlacesInTaichung,
  buildDistrictAreas,
  TAICHUNG_DISTRICTS,
} from "@/server/services/restaurantImportService";
import type { PlaceSearchResult } from "@/server/clients/placesClient";

describe("toRestaurantUpsertInput", () => {
  it("查詢來源行政區跟地址相符時，district 通過驗證予以保留", () => {
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

  it("查詢來源行政區跟地址不符時（Text Search 相關性排序帶到鄰近行政區），district 存 null 不信任查詢來源", () => {
    const place: PlaceSearchResult = {
      placeId: "place-2",
      name: "查詢帶到但實際在南屯區的店",
      address: "台中市南屯區某路 2 號",
      lat: 24.14,
      lng: 120.63,
      categoryName: "咖啡廳",
      phone: null,
    };

    expect(
      toRestaurantUpsertInput(place, "category-1", "台中市", "西區").district,
    ).toBeNull();
  });

  it("查詢沒有帶入行政區（district 為 null）時，維持 null", () => {
    const place: PlaceSearchResult = {
      placeId: "place-3",
      name: "沒有行政區來源的店",
      address: "台中市西區某路 3 號",
      lat: 24.15,
      lng: 120.67,
      categoryName: "咖啡廳",
      phone: null,
    };

    expect(
      toRestaurantUpsertInput(place, "category-1", "台中市", null).district,
    ).toBeNull();
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
