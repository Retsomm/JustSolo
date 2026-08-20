import { describe, expect, it } from "vitest";
import { estimateWalkingMinutes, findNearest, haversineDistanceKm } from "@/lib/geo";
import type { RestaurantMapMarker } from "@/types/restaurant";

const makeMarker = (
  overrides: Partial<RestaurantMapMarker>,
): RestaurantMapMarker => ({
  id: "1",
  name: "測試餐廳",
  categoryName: "燒肉",
  address: "台中市某路 1 號",
  lat: 24.1477,
  lng: 120.6736,
  soloSeatStatus: "CONFIRMED_YES",
  ...overrides,
});

describe("haversineDistanceKm", () => {
  it("同一個點的距離是 0", () => {
    const point = { lat: 24.1477, lng: 120.6736 };
    expect(haversineDistanceKm(point, point)).toBeCloseTo(0, 5);
  });

  it("算出兩個已知座標間的合理距離（台中車站到逢甲夜市，約 5-6 公里）", () => {
    const taichungStation = { lat: 24.1367, lng: 120.6852 };
    const fengchia = { lat: 24.1786, lng: 120.6469 };

    const distance = haversineDistanceKm(taichungStation, fengchia);

    expect(distance).toBeGreaterThan(4);
    expect(distance).toBeLessThan(7);
  });
});

describe("estimateWalkingMinutes", () => {
  it("以時速 5 公里換算，至少 1 分鐘", () => {
    expect(estimateWalkingMinutes(0)).toBe(1);
    expect(estimateWalkingMinutes(1)).toBe(12);
    expect(estimateWalkingMinutes(0.1)).toBe(2);
  });
});

describe("findNearest", () => {
  const origin = { lat: 24.1477, lng: 120.6736 };

  it("不篩選單人座位狀態，單純找離 origin 最近的一筆", () => {
    const markers = [
      makeMarker({ id: "far-yes", lat: 24.3, lng: 120.9, soloSeatStatus: "CONFIRMED_YES" }),
      makeMarker({ id: "near-unknown", lat: 24.1478, lng: 120.6737, soloSeatStatus: "UNKNOWN" }),
      makeMarker({ id: "near-yes", lat: 24.1479, lng: 120.6738, soloSeatStatus: "CONFIRMED_YES" }),
    ];

    const result = findNearest(markers, origin);

    expect(result?.id).toBe("near-unknown");
  });

  it("清單為空時回傳 null", () => {
    expect(findNearest([], origin)).toBeNull();
  });
});
