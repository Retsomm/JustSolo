import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RestaurantDetailView } from "@/app/restaurant/[id]/RestaurantDetailView";
import { useRestaurantDetail } from "@/hooks/useRestaurantDetail";
import type { RestaurantDetail } from "@/types/restaurant";

vi.mock("@/hooks/useRestaurantDetail");
// 回報表單本身有自己的測試（SoloSeatReportForm.test.tsx），這裡只關心詳情頁本身的呈現，
// 用一個簡單的 stub 避免要另外準備 SessionProvider/tRPC Provider。
vi.mock("@/components/SoloSeatReportForm", () => ({
  SoloSeatReportForm: () => null,
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
};

describe("RestaurantDetailView", () => {
  it("顯示餐廳詳細資訊（含電話）", () => {
    mockedUseRestaurantDetail.mockReturnValue({
      data: restaurant,
      isLoading: false,
    } as unknown as ReturnType<typeof useRestaurantDetail>);

    render(<RestaurantDetailView id="r1" />);

    expect(screen.getByText("測試燒肉店")).toBeInTheDocument();
    expect(screen.getByText("台中市西區某路 1 號")).toBeInTheDocument();
    expect(screen.getByText("電話：04-1234 5678")).toBeInTheDocument();
    expect(screen.getByText(/已確認有單人座位/)).toBeInTheDocument();
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

  it("有回報時顯示單人座位信心分數與回報則數", () => {
    mockedUseRestaurantDetail.mockReturnValue({
      data: { ...restaurant, soloSeatConfidence: 0.75, reportCount: 4 },
      isLoading: false,
    } as unknown as ReturnType<typeof useRestaurantDetail>);

    render(<RestaurantDetailView id="r1" />);

    expect(screen.getByText("單人座位信心：75%（4 則回報）")).toBeInTheDocument();
  });

  it("沒有回報時不顯示信心分數", () => {
    mockedUseRestaurantDetail.mockReturnValue({
      data: restaurant,
      isLoading: false,
    } as unknown as ReturnType<typeof useRestaurantDetail>);

    render(<RestaurantDetailView id="r1" />);

    expect(screen.queryByText(/單人座位信心/)).not.toBeInTheDocument();
  });

  it("載入中時顯示載入中文字", () => {
    mockedUseRestaurantDetail.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useRestaurantDetail>);

    render(<RestaurantDetailView id="r1" />);

    expect(screen.getByText("載入中…")).toBeInTheDocument();
  });
});
