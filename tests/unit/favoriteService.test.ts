import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  addFavorite,
  findFavoriteByUserAndRestaurant,
  listFavoriteRestaurantsByUserId,
  removeFavorite,
} from "@/server/clients/prismaClient";
import {
  checkIsFavorited,
  listFavoriteRestaurants,
  toggleFavorite,
} from "@/server/services/favoriteService";
import type { RestaurantSearchResult } from "@/types/restaurant";

vi.mock("@/server/clients/prismaClient", () => ({
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  findFavoriteByUserAndRestaurant: vi.fn(),
  listFavoriteRestaurantsByUserId: vi.fn(),
}));

const mockedAddFavorite = vi.mocked(addFavorite);
const mockedRemoveFavorite = vi.mocked(removeFavorite);
const mockedFindFavoriteByUserAndRestaurant = vi.mocked(
  findFavoriteByUserAndRestaurant,
);
const mockedListFavoriteRestaurantsByUserId = vi.mocked(
  listFavoriteRestaurantsByUserId,
);

const makeRestaurant = (
  overrides: Partial<RestaurantSearchResult> = {},
): RestaurantSearchResult => ({
  id: "r1",
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

describe("toggleFavorite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("isFavorited 為 true 時呼叫 addFavorite，回傳 isFavorited: true", async () => {
    const result = await toggleFavorite("u1", "r1", true);

    expect(mockedAddFavorite).toHaveBeenCalledWith("u1", "r1");
    expect(mockedRemoveFavorite).not.toHaveBeenCalled();
    expect(result).toEqual({ isFavorited: true });
  });

  it("isFavorited 為 false 時呼叫 removeFavorite，回傳 isFavorited: false", async () => {
    const result = await toggleFavorite("u1", "r1", false);

    expect(mockedRemoveFavorite).toHaveBeenCalledWith("u1", "r1");
    expect(mockedAddFavorite).not.toHaveBeenCalled();
    expect(result).toEqual({ isFavorited: false });
  });

  it("同一個目標狀態被並行重複呼叫時結果一致，不會因為競爭讀到的現況不同而互相矛盾", async () => {
    const results = await Promise.all([
      toggleFavorite("u1", "r1", true),
      toggleFavorite("u1", "r1", true),
      toggleFavorite("u1", "r1", true),
    ]);

    expect(results).toEqual([
      { isFavorited: true },
      { isFavorited: true },
      { isFavorited: true },
    ]);
    expect(mockedAddFavorite).toHaveBeenCalledTimes(3);
    expect(mockedRemoveFavorite).not.toHaveBeenCalled();
  });
});

describe("checkIsFavorited", () => {
  it("轉呼叫 Client 層並回傳結果", async () => {
    mockedFindFavoriteByUserAndRestaurant.mockResolvedValue(true);

    await expect(checkIsFavorited("u1", "r1")).resolves.toBe(true);
    expect(mockedFindFavoriteByUserAndRestaurant).toHaveBeenCalledWith(
      "u1",
      "r1",
    );
  });
});

describe("listFavoriteRestaurants", () => {
  it("把 Client 層已分頁好的清單補上友善度分數/標籤，並轉呼叫時帶正確的 page/pageSize", async () => {
    mockedListFavoriteRestaurantsByUserId.mockResolvedValue({
      items: [
        makeRestaurant({ id: "r1", soloSeatStatus: "CONFIRMED_YES", soloSeatConfidence: 1 }),
      ],
      totalCount: 1,
      page: 1,
      totalPages: 1,
    });

    const result = await listFavoriteRestaurants("u1", 1);

    expect(mockedListFavoriteRestaurantsByUserId).toHaveBeenCalledWith(
      "u1",
      1,
      10,
    );
    expect(result).toEqual(
      expect.objectContaining({
        page: 1,
        pageSize: 10,
        totalCount: 1,
        totalPages: 1,
        items: [
          expect.objectContaining({
            id: "r1",
            soloFriendlinessScore: expect.any(Number),
            soloFriendlinessLabel: expect.any(String),
          }),
        ],
      }),
    );
  });

  it("直接沿用 Client 層回傳的 page/totalPages/totalCount（分頁夾範圍的邏輯在 Client 層做）", async () => {
    mockedListFavoriteRestaurantsByUserId.mockResolvedValue({
      items: [makeRestaurant({ id: "r11" }), makeRestaurant({ id: "r12" })],
      totalCount: 12,
      page: 2,
      totalPages: 2,
    });

    const result = await listFavoriteRestaurants("u1", 2);

    expect(mockedListFavoriteRestaurantsByUserId).toHaveBeenCalledWith(
      "u1",
      2,
      10,
    );
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.totalCount).toBe(12);
    expect(result.items.map((r) => r.id)).toEqual(["r11", "r12"]);
  });
});
