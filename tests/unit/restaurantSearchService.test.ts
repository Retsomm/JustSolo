import { describe, expect, it, vi, beforeEach } from "vitest";
import { findRestaurants } from "@/server/clients/prismaClient";
import {
  filterAndSortBySoloSeat,
  paginate,
  searchRestaurants,
} from "@/server/services/restaurantSearchService";
import type { RestaurantSearchResult } from "@/types/restaurant";

vi.mock("@/server/clients/prismaClient", () => ({
  findRestaurants: vi.fn(),
}));

const mockedFindRestaurants = vi.mocked(findRestaurants);

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

describe("paginate", () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it("回傳指定頁的資料與分頁中繼資料", () => {
    expect(paginate(items, 1, 10)).toEqual({
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      page: 1,
      pageSize: 10,
      totalCount: 25,
      totalPages: 3,
    });
  });

  it("回傳最後一頁時筆數可以少於 pageSize", () => {
    const result = paginate(items, 3, 10);

    expect(result.items).toEqual([21, 22, 23, 24, 25]);
    expect(result.totalPages).toBe(3);
  });

  it("page 超過 totalPages 時夾回最後一頁", () => {
    const result = paginate(items, 99, 10);

    expect(result.page).toBe(3);
    expect(result.items).toEqual([21, 22, 23, 24, 25]);
  });

  it("page 小於 1 時夾回第 1 頁", () => {
    const result = paginate(items, 0, 10);

    expect(result.page).toBe(1);
  });

  it("沒有資料時 totalPages 至少是 1", () => {
    const result = paginate([], 1, 10);

    expect(result).toEqual({
      items: [],
      page: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 1,
    });
  });
});

describe("searchRestaurants", () => {
  beforeEach(() => {
    mockedFindRestaurants.mockReset();
    mockedFindRestaurants.mockResolvedValue([]);
  });

  // 這個測試是為了補之前漏掉的坑：曾經在 input 加了 district/keyword 卻忘記
  // 從 searchRestaurants 傳給 findRestaurants，UI 篩選送出去了但後端悄悄丟掉，
  // 使用者實測「篩選完全沒作用」才發現。用這個測試把「Service 有沒有把 input
  // 的每個欄位都轉呼叫給 Client」這件事釘死，不要只測純函式、漏了組合層的接線。
  it("把 category/district/keyword/city 完整轉呼叫給 findRestaurants", async () => {
    await searchRestaurants({
      category: "燒肉",
      district: "西區",
      keyword: "貳食",
      city: "台中市",
      soloSeatOnly: false,
      page: 1,
    });

    expect(mockedFindRestaurants).toHaveBeenCalledWith({
      category: "燒肉",
      district: "西區",
      keyword: "貳食",
      city: "台中市",
    });
  });
});
