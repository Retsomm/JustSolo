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

  it("尚未收藏時呼叫 addFavorite，回傳 isFavorited: true", async () => {
    mockedFindFavoriteByUserAndRestaurant.mockResolvedValue(false);

    const result = await toggleFavorite("u1", "r1");

    expect(mockedAddFavorite).toHaveBeenCalledWith("u1", "r1");
    expect(mockedRemoveFavorite).not.toHaveBeenCalled();
    expect(result).toEqual({ isFavorited: true });
  });

  it("已收藏時呼叫 removeFavorite，回傳 isFavorited: false", async () => {
    mockedFindFavoriteByUserAndRestaurant.mockResolvedValue(true);

    const result = await toggleFavorite("u1", "r1");

    expect(mockedRemoveFavorite).toHaveBeenCalledWith("u1", "r1");
    expect(mockedAddFavorite).not.toHaveBeenCalled();
    expect(result).toEqual({ isFavorited: false });
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
  it("把 Client 層回傳的清單補上友善度分數/標籤，並回傳分頁後第 1 頁", async () => {
    mockedListFavoriteRestaurantsByUserId.mockResolvedValue([
      makeRestaurant({ id: "r1", soloSeatStatus: "CONFIRMED_YES", soloSeatConfidence: 1 }),
    ]);

    const result = await listFavoriteRestaurants("u1", 1);

    expect(mockedListFavoriteRestaurantsByUserId).toHaveBeenCalledWith("u1");
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

  it("收藏筆數超過一頁時，依 page 參數切出正確的那一頁", async () => {
    mockedListFavoriteRestaurantsByUserId.mockResolvedValue(
      Array.from({ length: 12 }, (_, i) => makeRestaurant({ id: `r${i + 1}` })),
    );

    const result = await listFavoriteRestaurants("u1", 2);

    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.totalCount).toBe(12);
    expect(result.items).toHaveLength(2);
    expect(result.items.map((r) => r.id)).toEqual(["r11", "r12"]);
  });
});
