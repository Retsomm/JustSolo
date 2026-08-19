import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";
import { useCategories } from "@/hooks/useCategories";
import { useRestaurantSearch } from "@/hooks/useRestaurantSearch";
import type { RestaurantSearchResult } from "@/types/restaurant";

vi.mock("@/hooks/useCategories");
vi.mock("@/hooks/useRestaurantSearch");

const mockedUseCategories = vi.mocked(useCategories);
const mockedUseRestaurantSearch = vi.mocked(useRestaurantSearch);

const soloSeatYesRestaurant: RestaurantSearchResult = {
  id: "r1",
  name: "測試燒肉店",
  categoryName: "燒肉",
  city: "台中市",
  district: null,
  address: "台中市西區某路 1 號",
  soloSeatStatus: "CONFIRMED_YES",
  soloSeatType: "吧台單人座",
};

beforeEach(() => {
  mockedUseCategories.mockReturnValue({
    data: [{ id: "c1", name: "燒肉" }],
    isLoading: false,
  } as unknown as ReturnType<typeof useCategories>);

  mockedUseRestaurantSearch.mockReturnValue({
    data: [soloSeatYesRestaurant],
    isLoading: false,
  } as unknown as ReturnType<typeof useRestaurantSearch>);
});

describe("首頁", () => {
  it("顯示分類選項與餐廳卡片（含單人座位狀態文字）", () => {
    render(<Home />);

    expect(screen.getByText("測試燒肉店")).toBeInTheDocument();
    expect(screen.getByText("台中市西區某路 1 號")).toBeInTheDocument();
    expect(screen.getByText(/已確認有單人座位/)).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "燒肉" }),
    ).toBeInTheDocument();
  });

  it("切換「僅顯示有單人座位」會用 soloSeatOnly=true 重新呼叫搜尋 hook", async () => {
    render(<Home />);

    const toggle = screen.getByRole("checkbox", {
      name: "僅顯示有單人座位",
    });
    await userEvent.click(toggle);

    expect(mockedUseRestaurantSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({ soloSeatOnly: true, city: "台中市" }),
    );
  });

  it("選擇分類會用該分類名稱重新呼叫搜尋 hook", async () => {
    render(<Home />);

    const select = screen.getByRole("combobox", { name: "分類" });
    await userEvent.selectOptions(select, "燒肉");

    expect(mockedUseRestaurantSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: "燒肉" }),
    );
  });

  it("沒有符合條件的餐廳時顯示空狀態文字", () => {
    mockedUseRestaurantSearch.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useRestaurantSearch>);

    render(<Home />);

    expect(
      screen.getByText("目前沒有符合條件的餐廳，換個篩選條件試試？"),
    ).toBeInTheDocument();
  });
});
