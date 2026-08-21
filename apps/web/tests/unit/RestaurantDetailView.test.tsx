import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RestaurantDetailView } from "@/app/restaurant/[id]/RestaurantDetailView";
import { useRestaurantDetail } from "@/hooks/useRestaurantDetail";
import type { RestaurantDetail } from "@justsolo/shared";

vi.mock("@/hooks/useRestaurantDetail");
// 回報表單本身有自己的測試（SoloSeatReportForm.test.tsx），這裡只關心詳情頁本身的呈現，
// 用一個簡單的 stub 避免要另外準備 SessionProvider/tRPC Provider。
vi.mock("@/components/SoloSeatReportForm", () => ({
  SoloSeatReportForm: () => null,
}));
// 收藏按鈕本身有自己的測試（FavoriteButton.test.tsx），這裡用 stub 避免要另外準備
// SessionProvider/tRPC Provider。
vi.mock("@/components/FavoriteButton", () => ({
  FavoriteButton: () => null,
}));
// PlaceDetailsSection 本身有自己的測試（PlaceDetailsSection.test.tsx），這裡只關心
// 詳情頁有沒有把 restaurantId/activeTab 正確傳下去、切換分頁按鈕有沒有反映到這個 prop。
vi.mock("@/components/PlaceDetailsSection", () => ({
  PlaceDetailsSection: ({
    restaurantId,
    activeTab,
  }: {
    restaurantId: string;
    activeTab: string;
  }) => (
    <div data-testid="place-details-section-stub">
      {restaurantId}:{activeTab}
    </div>
  ),
}));

const mockedUseRestaurantDetail = vi.mocked(useRestaurantDetail);

const restaurant: RestaurantDetail = {
  id: "r1",
  name: "測試燒肉店",
  categoryName: "燒肉",
  city: "台中市",
  district: null,
  address: "台中市西區某路 1 號",
  lat: 24.15,
  lng: 120.68,
  soloSeatStatus: "CONFIRMED_YES",
  soloSeatType: "吧台單人座",
  phone: "04-1234 5678",
  soloSeatConfidence: 0,
  reportCount: 0,
  soloFriendlinessScore: 75,
  soloFriendlinessLabel: "適合單人",
};

describe("RestaurantDetailView", () => {
  it("顯示餐廳基本資訊（含電話），預設是總覽 tab", () => {
    mockedUseRestaurantDetail.mockReturnValue({
      data: restaurant,
      isLoading: false,
    } as unknown as ReturnType<typeof useRestaurantDetail>);

    render(<RestaurantDetailView id="r1" />);

    expect(screen.getByText("測試燒肉店")).toBeInTheDocument();
    expect(screen.getByText("台中市西區某路 1 號")).toBeInTheDocument();
    expect(screen.getByText("電話：04-1234 5678")).toBeInTheDocument();
    expect(screen.getByTestId("place-details-section-stub")).toHaveTextContent(
      "r1:overview",
    );
    expect(screen.getByRole("tab", { name: "總覽" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("沒有電話時不顯示電話那一行", () => {
    mockedUseRestaurantDetail.mockReturnValue({
      data: { ...restaurant, phone: null },
      isLoading: false,
    } as unknown as ReturnType<typeof useRestaurantDetail>);

    render(<RestaurantDetailView id="r1" />);

    expect(screen.queryByText(/電話：/)).not.toBeInTheDocument();
  });

  it("找不到餐廳時顯示提示文字", () => {
    mockedUseRestaurantDetail.mockReturnValue({
      data: null,
      isLoading: false,
    } as unknown as ReturnType<typeof useRestaurantDetail>);

    render(<RestaurantDetailView id="not-exist" />);

    expect(screen.getByText("找不到這間餐廳。")).toBeInTheDocument();
  });

  it("載入中時顯示載入中文字", () => {
    mockedUseRestaurantDetail.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useRestaurantDetail>);

    render(<RestaurantDetailView id="r1" />);

    expect(screen.getByText("載入中…")).toBeInTheDocument();
  });

  describe("分類按鈕（tabs）", () => {
    it("點擊「菜單」「評論」「圖片」會切換 PlaceDetailsSection 的 activeTab", async () => {
      mockedUseRestaurantDetail.mockReturnValue({
        data: restaurant,
        isLoading: false,
      } as unknown as ReturnType<typeof useRestaurantDetail>);

      render(<RestaurantDetailView id="r1" />);

      await userEvent.click(screen.getByRole("tab", { name: "菜單" }));
      expect(screen.getByTestId("place-details-section-stub")).toHaveTextContent(
        "r1:menu",
      );

      await userEvent.click(screen.getByRole("tab", { name: "評論" }));
      expect(screen.getByTestId("place-details-section-stub")).toHaveTextContent(
        "r1:reviews",
      );

      await userEvent.click(screen.getByRole("tab", { name: "圖片" }));
      expect(screen.getByTestId("place-details-section-stub")).toHaveTextContent(
        "r1:photos",
      );
    });

    it("點擊「單人友善」會顯示單人座位狀態/友善度徽章/回報表單，並隱藏 PlaceDetailsSection", async () => {
      mockedUseRestaurantDetail.mockReturnValue({
        data: { ...restaurant, soloSeatConfidence: 0.75, reportCount: 4 },
        isLoading: false,
      } as unknown as ReturnType<typeof useRestaurantDetail>);

      render(<RestaurantDetailView id="r1" />);

      expect(screen.queryByText(/已確認有單人座位/)).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole("tab", { name: "單人友善" }));

      expect(screen.getByText(/已確認有單人座位/)).toBeInTheDocument();
      expect(screen.getByText("適合單人")).toBeInTheDocument();
      expect(screen.getByText("單人座位信心：75%（4 則回報）")).toBeInTheDocument();
      expect(
        screen.queryByTestId("place-details-section-stub"),
      ).not.toBeInTheDocument();
    });

    it("單人友善 tab 沒有回報時不顯示信心分數", async () => {
      mockedUseRestaurantDetail.mockReturnValue({
        data: restaurant,
        isLoading: false,
      } as unknown as ReturnType<typeof useRestaurantDetail>);

      render(<RestaurantDetailView id="r1" />);

      await userEvent.click(screen.getByRole("tab", { name: "單人友善" }));

      expect(screen.queryByText(/單人座位信心/)).not.toBeInTheDocument();
    });
  });
});
