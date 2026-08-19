import { describe, expect, it } from "vitest";
import { filterAndSortBySoloSeat } from "@/server/services/restaurantSearchService";
import type { RestaurantSearchResult } from "@/types/restaurant";

const makeRestaurant = (
  overrides: Partial<RestaurantSearchResult>,
): RestaurantSearchResult => ({
  id: "1",
  name: "測試餐廳",
  categoryName: "燒肉",
  city: "台中市",
  district: null,
  address: "台中市某路 1 號",
  soloSeatStatus: "UNKNOWN",
  soloSeatType: null,
  ...overrides,
});

describe("filterAndSortBySoloSeat", () => {
  it("soloSeatOnly=true 時只保留 CONFIRMED_YES", () => {
    const restaurants = [
      makeRestaurant({ id: "1", soloSeatStatus: "CONFIRMED_YES" }),
      makeRestaurant({ id: "2", soloSeatStatus: "UNKNOWN" }),
      makeRestaurant({ id: "3", soloSeatStatus: "CONFIRMED_NO" }),
    ];

    const result = filterAndSortBySoloSeat(restaurants, true);

    expect(result.map((r) => r.id)).toEqual(["1"]);
  });

  it("soloSeatOnly=false 時保留全部，並依 CONFIRMED_YES > UNKNOWN > CONFIRMED_NO 排序", () => {
    const restaurants = [
      makeRestaurant({ id: "1", soloSeatStatus: "CONFIRMED_NO" }),
      makeRestaurant({ id: "2", soloSeatStatus: "CONFIRMED_YES" }),
      makeRestaurant({ id: "3", soloSeatStatus: "UNKNOWN" }),
    ];

    const result = filterAndSortBySoloSeat(restaurants, false);

    expect(result.map((r) => r.id)).toEqual(["2", "3", "1"]);
  });

  it("不會 mutate 傳入的原始陣列", () => {
    const restaurants = [
      makeRestaurant({ id: "1", soloSeatStatus: "CONFIRMED_NO" }),
      makeRestaurant({ id: "2", soloSeatStatus: "CONFIRMED_YES" }),
    ];
    const original = [...restaurants];

    filterAndSortBySoloSeat(restaurants, false);

    expect(restaurants).toEqual(original);
  });
});
