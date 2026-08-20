import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlaceDetailsSection } from "@/components/PlaceDetailsSection";
import { useRestaurantPlaceDetails } from "@/hooks/useRestaurantPlaceDetails";
import type { PlaceDetails } from "@/server/clients/placesClient";

vi.mock("@/hooks/useRestaurantPlaceDetails");

const mockedUseRestaurantPlaceDetails = vi.mocked(useRestaurantPlaceDetails);

const placeDetails: PlaceDetails = {
  rating: 4.8,
  userRatingCount: 5001,
  priceLevel: "PRICE_LEVEL_MODERATE",
  openingHours: ["星期一: 10:00 – 21:00"],
  websiteUri: "https://example.com",
  googleMapsUri: "https://maps.google.com/?cid=123",
  editorialSummary: "裝潢低調的愜意餐廳",
  photos: [
    { name: "places/p1/photos/a", widthPx: 100, heightPx: 100 },
    { name: "places/p1/photos/b", widthPx: 100, heightPx: 100 },
  ],
  reviews: [
    {
      authorName: "小黃魚",
      authorUri: "https://www.google.com/maps/contrib/123",
      rating: 5,
      relativeTime: "3 個月前",
      text: "東西好吃",
    },
    {
      authorName: "邱家瑩",
      authorUri: null,
      rating: 3,
      relativeTime: "2 個月前",
      text: "餐點好吃基本上都蠻好吃的",
    },
  ],
};

const mockData = (
  overrides: Partial<{
    data: PlaceDetails | null | undefined;
    isLoading: boolean;
    isError: boolean;
  }> = {},
) => {
  mockedUseRestaurantPlaceDetails.mockReturnValue({
    data: placeDetails,
    isLoading: false,
    isError: false,
    ...overrides,
  } as unknown as ReturnType<typeof useRestaurantPlaceDetails>);
};

describe("PlaceDetailsSection", () => {
  it("載入中時顯示載入文字", () => {
    mockData({ data: undefined, isLoading: true });

    render(<PlaceDetailsSection restaurantId="r1" activeTab="overview" />);

    expect(screen.getByText("載入更多資訊中…")).toBeInTheDocument();
  });

  it("沒有資料（沒有 placeId）時顯示中性提示", () => {
    mockData({ data: null });

    render(<PlaceDetailsSection restaurantId="r1" activeTab="overview" />);

    expect(screen.getByText("目前沒有更多資訊可顯示。")).toBeInTheDocument();
  });

  it("查詢失敗時顯示中性提示（不嚇到使用者）", () => {
    mockData({ data: undefined, isError: true });

    render(<PlaceDetailsSection restaurantId="r1" activeTab="overview" />);

    expect(screen.getByText("目前沒有更多資訊可顯示。")).toBeInTheDocument();
  });

  describe("總覽 tab", () => {
    it("顯示評分/價位/簡介/營業時間", () => {
      mockData();

      render(<PlaceDetailsSection restaurantId="r1" activeTab="overview" />);

      expect(screen.getByText(/4.8/)).toBeInTheDocument();
      expect(screen.getByText(/Google 上共 5001 人評分/)).toBeInTheDocument();
      expect(screen.getByText("· $$")).toBeInTheDocument();
      expect(screen.getByText("裝潢低調的愜意餐廳")).toBeInTheDocument();
      expect(screen.getByText("星期一: 10:00 – 21:00")).toBeInTheDocument();
    });
  });

  describe("菜單 tab", () => {
    it("顯示官網連結與 Google Maps 菜單連結", () => {
      mockData();

      render(<PlaceDetailsSection restaurantId="r1" activeTab="menu" />);

      expect(screen.getByRole("link", { name: "前往官網" })).toHaveAttribute(
        "href",
        "https://example.com",
      );
      expect(
        screen.getByRole("link", { name: "在 Google Maps 上查看菜單與更多資訊" }),
      ).toHaveAttribute("href", "https://maps.google.com/?cid=123");
    });
  });

  describe("評論 tab", () => {
    it("一次全部顯示（最多 5 則，不分頁）", () => {
      mockData();

      render(<PlaceDetailsSection restaurantId="r1" activeTab="reviews" />);

      expect(screen.getByText("小黃魚")).toBeInTheDocument();
      expect(screen.getByText("東西好吃")).toBeInTheDocument();
      expect(screen.getByText("邱家瑩")).toBeInTheDocument();
      expect(screen.getByText("餐點好吃基本上都蠻好吃的")).toBeInTheDocument();
      expect(screen.queryByLabelText("分頁")).not.toBeInTheDocument();
      expect(screen.getByText(/Google 只提供最多 5 則精選評論/)).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "完整評論請至 Google Maps 查看" }),
      ).toHaveAttribute("href", "https://maps.google.com/?cid=123");
    });

    it("沒有評論時顯示提示文字", () => {
      mockData({ data: { ...placeDetails, reviews: [] } });

      render(<PlaceDetailsSection restaurantId="r1" activeTab="reviews" />);

      expect(screen.getByText("目前沒有評論。")).toBeInTheDocument();
    });
  });

  describe("圖片 tab", () => {
    it("顯示縮圖格線", () => {
      mockData();

      render(<PlaceDetailsSection restaurantId="r1" activeTab="photos" />);

      expect(
        screen.getByRole("button", { name: "放大檢視第 1 張照片" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "放大檢視第 2 張照片" }),
      ).toBeInTheDocument();
    });

    it("點縮圖會開啟 lightbox，點關閉會收起來", async () => {
      mockData();

      render(<PlaceDetailsSection restaurantId="r1" activeTab="photos" />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      await userEvent.click(
        screen.getByRole("button", { name: "放大檢視第 2 張照片" }),
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("img", { name: /第 2 張/ })).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "關閉" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("沒有照片時顯示提示文字", () => {
      mockData({ data: { ...placeDetails, photos: [] } });

      render(<PlaceDetailsSection restaurantId="r1" activeTab="photos" />);

      expect(screen.getByText("目前沒有照片。")).toBeInTheDocument();
    });
  });
});
