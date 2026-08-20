import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MapPage from "@/app/map/page";
import { useRestaurantMapMarkers } from "@/hooks/useRestaurantMapMarkers";
import type { RestaurantMapMarker } from "@/types/restaurant";

vi.mock("@/hooks/useRestaurantMapMarkers");
vi.mock("@/components/RestaurantMap", () => ({
  RestaurantMap: ({ restaurants }: { restaurants: { id: string }[] }) => (
    <div data-testid="restaurant-map-mock">地圖 marker 數：{restaurants.length}</div>
  ),
}));

const mockedUseRestaurantMapMarkers = vi.mocked(useRestaurantMapMarkers);

const markers: RestaurantMapMarker[] = [
  {
    id: "far",
    name: "較遠的燒肉店",
    categoryName: "燒肉",
    address: "台中市某路 1 號",
    lat: 24.3,
    lng: 120.9,
    soloSeatStatus: "CONFIRMED_YES",
  },
  {
    id: "near",
    name: "較近但不是最近的拉麵店",
    categoryName: "拉麵",
    address: "台中市某路 2 號",
    lat: 24.148,
    lng: 120.674,
    soloSeatStatus: "CONFIRMED_YES",
  },
  {
    id: "nearest-unknown",
    name: "最近但單人座位尚未確認",
    categoryName: "咖啡廳",
    address: "台中市某路 3 號",
    lat: 24.1477,
    lng: 120.6736,
    soloSeatStatus: "UNKNOWN",
  },
];

const mockGeolocation = (
  impl: (
    success: PositionCallback,
    error?: PositionErrorCallback,
  ) => void,
) => {
  Object.defineProperty(global.navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition: vi.fn(impl) },
  });
};

beforeEach(() => {
  mockedUseRestaurantMapMarkers.mockReturnValue({
    data: markers,
    isLoading: false,
  } as unknown as ReturnType<typeof useRestaurantMapMarkers>);
});

describe("MapPage", () => {
  it("取得定位成功時，顯示離使用者最近的一家（不限單人座位狀態，目前可信資料還很少）", async () => {
    mockGeolocation((success) => {
      success({
        coords: { latitude: 24.1477, longitude: 120.6736 },
      } as GeolocationPosition);
    });

    render(<MapPage />);

    expect(await screen.findByText("最近但單人座位尚未確認")).toBeInTheDocument();
    expect(screen.queryByText("較遠的燒肉店")).not.toBeInTheDocument();
    expect(screen.queryByText("較近但不是最近的拉麵店")).not.toBeInTheDocument();
    expect(screen.getByText("尚未確認，建議致電詢問")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "回列表" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "查看詳情" })).toHaveAttribute(
      "href",
      "/restaurant/nearest-unknown",
    );
  });

  it("定位被拒絕時，顯示提示與「允許定位」重試按鈕", async () => {
    mockGeolocation((_success, error) => {
      error?.({ code: 1 } as GeolocationPositionError);
    });

    render(<MapPage />);

    expect(
      await screen.findByText("無法取得你的位置，改為顯示地圖與所有結果。"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "允許定位" }),
    ).toBeInTheDocument();
  });

  it("完全沒有餐廳資料時，顯示提示文字", async () => {
    mockedUseRestaurantMapMarkers.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useRestaurantMapMarkers>);
    mockGeolocation((success) => {
      success({
        coords: { latitude: 24.1477, longitude: 120.6736 },
      } as GeolocationPosition);
    });

    render(<MapPage />);

    expect(await screen.findByText("目前沒有餐廳資料。")).toBeInTheDocument();
  });

  it("點擊「顯示完整地圖」會渲染完整地圖，含所有 marker", async () => {
    mockGeolocation((success) => {
      success({
        coords: { latitude: 24.1477, longitude: 120.6736 },
      } as GeolocationPosition);
    });

    render(<MapPage />);
    await screen.findByText("最近但單人座位尚未確認");

    expect(
      screen.queryByTestId("restaurant-map-mock"),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "顯示完整地圖" }));

    expect(await screen.findByTestId("restaurant-map-mock")).toHaveTextContent(
      "地圖 marker 數：3",
    );
  });
});
