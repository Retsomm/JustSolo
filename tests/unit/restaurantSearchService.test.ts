import { describe, expect, it, vi, beforeEach } from "vitest";
import { findRestaurants } from "@/server/clients/prismaClient";
import {
  computeSoloFriendlinessScore,
  filterAndSortBySoloSeat,
  getRestaurantMapMarkers,
  resolveSoloFriendlinessLabel,
  searchRestaurants,
  toMapMarkers,
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
  lat: 24.1477,
  lng: 120.6736,
  soloSeatStatus: "UNKNOWN",
  soloSeatType: null,
  soloSeatConfidence: 0,
  ...overrides,
});

describe("computeSoloFriendlinessScore", () => {
  it("CONFIRMED_YES：底分 70 + 信心分數貢獻最多 30 分", () => {
    expect(
      computeSoloFriendlinessScore({
        soloSeatStatus: "CONFIRMED_YES",
        soloSeatConfidence: 0,
        soloSeatType: null,
      }),
    ).toEqual({ soloFriendlinessScore: 70, soloFriendlinessLabel: "適合單人" });

    expect(
      computeSoloFriendlinessScore({
        soloSeatStatus: "CONFIRMED_YES",
        soloSeatConfidence: 1,
        soloSeatType: null,
      }),
    ).toEqual({
      soloFriendlinessScore: 100,
      soloFriendlinessLabel: "非常適合單人",
    });
  });

  it("CONFIRMED_YES：有 soloSeatType 加 5 分，但總分不超過 100", () => {
    const result = computeSoloFriendlinessScore({
      soloSeatStatus: "CONFIRMED_YES",
      soloSeatConfidence: 1,
      soloSeatType: "吧台單人座",
    });

    expect(result.soloFriendlinessScore).toBe(100);
  });

  it("CONFIRMED_NO：信心分數越高分數越低，且不會落到「適合」等級", () => {
    expect(
      computeSoloFriendlinessScore({
        soloSeatStatus: "CONFIRMED_NO",
        soloSeatConfidence: 1,
        soloSeatType: null,
      }),
    ).toEqual({
      soloFriendlinessScore: 0,
      soloFriendlinessLabel: "不建議單人前往",
    });

    expect(
      computeSoloFriendlinessScore({
        soloSeatStatus: "CONFIRMED_NO",
        soloSeatConfidence: 0,
        soloSeatType: null,
      }),
    ).toEqual({
      soloFriendlinessScore: 20,
      soloFriendlinessLabel: "不建議單人前往",
    });
  });

  it("CONFIRMED_NO：有 soloSeatType 一樣加 5 分，但仍不會落到「適合」等級", () => {
    expect(
      computeSoloFriendlinessScore({
        soloSeatStatus: "CONFIRMED_NO",
        soloSeatConfidence: 0,
        soloSeatType: "吧台單人座",
      }),
    ).toEqual({
      soloFriendlinessScore: 25,
      soloFriendlinessLabel: "不建議單人前往",
    });
  });

  it("UNKNOWN：固定中段分數，soloSeatType 加 5 分", () => {
    expect(
      computeSoloFriendlinessScore({
        soloSeatStatus: "UNKNOWN",
        soloSeatConfidence: 0,
        soloSeatType: null,
      }),
    ).toEqual({
      soloFriendlinessScore: 40,
      soloFriendlinessLabel: "未知，建議致電確認",
    });

    expect(
      computeSoloFriendlinessScore({
        soloSeatStatus: "UNKNOWN",
        soloSeatConfidence: 0,
        soloSeatType: "單人小桌",
      }),
    ).toEqual({
      soloFriendlinessScore: 45,
      soloFriendlinessLabel: "未知，建議致電確認",
    });
  });
});

describe("resolveSoloFriendlinessLabel", () => {
  it("依分數門檻回傳對應標籤（邊界值）", () => {
    expect(resolveSoloFriendlinessLabel(85)).toBe("非常適合單人");
    expect(resolveSoloFriendlinessLabel(84)).toBe("適合單人");
    expect(resolveSoloFriendlinessLabel(65)).toBe("適合單人");
    expect(resolveSoloFriendlinessLabel(64)).toBe("未知，建議致電確認");
    expect(resolveSoloFriendlinessLabel(35)).toBe("未知，建議致電確認");
    expect(resolveSoloFriendlinessLabel(34)).toBe("不建議單人前往");
  });
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

  it("同一個 soloSeatStatus 內，信心分數較高的排前面", () => {
    const restaurants = [
      makeRestaurant({
        id: "1",
        soloSeatStatus: "CONFIRMED_YES",
        soloSeatConfidence: 0.2,
      }),
      makeRestaurant({
        id: "2",
        soloSeatStatus: "CONFIRMED_YES",
        soloSeatConfidence: 0.9,
      }),
    ];

    const result = filterAndSortBySoloSeat(restaurants, false);

    expect(result.map((r) => r.id)).toEqual(["2", "1"]);
  });

  it("回傳的每一筆都附上算好的友善度分數與標籤", () => {
    const restaurants = [
      makeRestaurant({ id: "1", soloSeatStatus: "CONFIRMED_YES", soloSeatConfidence: 1 }),
    ];

    const result = filterAndSortBySoloSeat(restaurants, false);

    expect(result[0]).toMatchObject({
      soloFriendlinessScore: 100,
      soloFriendlinessLabel: "非常適合單人",
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

describe("toMapMarkers", () => {
  it("濾掉 lat/lng 任一為 null 的餐廳，並只保留 marker 需要的欄位", () => {
    const restaurants = [
      makeRestaurant({ id: "1", lat: 24.1, lng: 120.6 }),
      makeRestaurant({ id: "2", lat: null }),
      makeRestaurant({ id: "3", lng: null }),
      makeRestaurant({ id: "4", lat: null, lng: null }),
    ];

    const result = toMapMarkers(restaurants);

    expect(result).toEqual([
      {
        id: "1",
        name: "測試餐廳",
        lat: 24.1,
        lng: 120.6,
        soloSeatStatus: "UNKNOWN",
      },
    ]);
  });
});

describe("getRestaurantMapMarkers", () => {
  beforeEach(() => {
    mockedFindRestaurants.mockReset();
  });

  // 比照 searchRestaurants 的接線測試：確保這個組合層一樣有把篩選欄位完整
  // 轉呼叫給 findRestaurants，不要重蹈之前漏傳 district/keyword 的坑。
  it("把 category/district/keyword/city 完整轉呼叫給 findRestaurants", async () => {
    mockedFindRestaurants.mockResolvedValue([]);

    await getRestaurantMapMarkers({
      category: "燒肉",
      district: "西區",
      keyword: "貳食",
      city: "台中市",
      soloSeatOnly: false,
    });

    expect(mockedFindRestaurants).toHaveBeenCalledWith({
      category: "燒肉",
      district: "西區",
      keyword: "貳食",
      city: "台中市",
    });
  });

  it("soloSeatOnly=true 時只回傳 CONFIRMED_YES 的 marker", async () => {
    mockedFindRestaurants.mockResolvedValue([
      makeRestaurant({ id: "1", soloSeatStatus: "CONFIRMED_YES" }),
      makeRestaurant({ id: "2", soloSeatStatus: "UNKNOWN" }),
    ]);

    const result = await getRestaurantMapMarkers({
      city: "台中市",
      soloSeatOnly: true,
    });

    expect(result.map((r) => r.id)).toEqual(["1"]);
  });

  it("排除沒有座標的餐廳", async () => {
    mockedFindRestaurants.mockResolvedValue([
      makeRestaurant({ id: "1", lat: 24.1, lng: 120.6 }),
      makeRestaurant({ id: "2", lat: null, lng: null }),
    ]);

    const result = await getRestaurantMapMarkers({
      city: "台中市",
      soloSeatOnly: false,
    });

    expect(result.map((r) => r.id)).toEqual(["1"]);
  });
});
