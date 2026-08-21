import { describe, expect, it, vi, beforeEach } from "vitest";
import { findRestaurantPlaceId } from "@/server/clients/prismaClient";
import { fetchPlaceDetails } from "@/server/clients/placesClient";
import { getRestaurantPlaceDetails } from "@/server/services/placeDetailsService";
import type { PlaceDetails } from "@/server/clients/placesClient";

vi.mock("@/server/clients/prismaClient", () => ({
  findRestaurantPlaceId: vi.fn(),
}));
vi.mock("@/server/clients/placesClient", () => ({
  fetchPlaceDetails: vi.fn(),
}));

const mockedFindRestaurantPlaceId = vi.mocked(findRestaurantPlaceId);
const mockedFetchPlaceDetails = vi.mocked(fetchPlaceDetails);

const placeDetails: PlaceDetails = {
  rating: 4.5,
  userRatingCount: 100,
  priceLevel: "PRICE_LEVEL_MODERATE",
  openingHours: ["星期一: 10:00 – 21:00"],
  websiteUri: null,
  googleMapsUri: "https://maps.google.com/?cid=123",
  editorialSummary: null,
  photos: [],
  reviews: [],
};

describe("getRestaurantPlaceDetails", () => {
  beforeEach(() => {
    mockedFindRestaurantPlaceId.mockReset();
    mockedFetchPlaceDetails.mockReset();
  });

  // 比照專案已經踩過兩次的坑（漏傳組合層參數，見 PROGRESS.md「已知的坑」第 16 條）：
  // 直接斷言 restaurantId 查出的 placeId 有正確轉呼叫給 fetchPlaceDetails。
  it("查到 placeId 時，把它轉呼叫給 fetchPlaceDetails", async () => {
    mockedFindRestaurantPlaceId.mockResolvedValue("place-1");
    mockedFetchPlaceDetails.mockResolvedValue(placeDetails);

    const result = await getRestaurantPlaceDetails("restaurant-1");

    expect(mockedFindRestaurantPlaceId).toHaveBeenCalledWith("restaurant-1");
    expect(mockedFetchPlaceDetails).toHaveBeenCalledWith("place-1");
    expect(result).toEqual(placeDetails);
  });

  it("沒有 placeId 時回傳 null，且不呼叫 fetchPlaceDetails（不打 Google API）", async () => {
    mockedFindRestaurantPlaceId.mockResolvedValue(null);

    const result = await getRestaurantPlaceDetails("restaurant-2");

    expect(result).toBeNull();
    expect(mockedFetchPlaceDetails).not.toHaveBeenCalled();
  });
});
