import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";
import { useCategories } from "@/hooks/useCategories";
import { useDistricts } from "@/hooks/useDistricts";
import { useRestaurantSearch } from "@/hooks/useRestaurantSearch";
import { useRestaurantMapMarkers } from "@/hooks/useRestaurantMapMarkers";
import type { PaginatedRestaurants, RestaurantSearchResult } from "@/types/restaurant";

vi.mock("@/hooks/useCategories");
vi.mock("@/hooks/useDistricts");
vi.mock("@/hooks/useRestaurantSearch");
vi.mock("@/hooks/useRestaurantMapMarkers");
vi.mock("@/components/RestaurantMap", () => ({
  RestaurantMap: ({ restaurants }: { restaurants: { id: string }[] }) => (
    <div data-testid="restaurant-map-mock">地圖 marker 數：{restaurants.length}</div>
  ),
}));

const mockedUseCategories = vi.mocked(useCategories);
const mockedUseDistricts = vi.mocked(useDistricts);
const mockedUseRestaurantSearch = vi.mocked(useRestaurantSearch);
const mockedUseRestaurantMapMarkers = vi.mocked(useRestaurantMapMarkers);

const soloSeatYesRestaurant: RestaurantSearchResult = {
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
};

const makePage = (
  overrides: Partial<PaginatedRestaurants> = {},
): PaginatedRestaurants => ({
  items: [soloSeatYesRestaurant],
  page: 1,
  pageSize: 10,
  totalCount: 1,
  totalPages: 1,
  ...overrides,
});

beforeEach(() => {
  mockedUseCategories.mockReturnValue({
    data: [{ id: "c1", name: "燒肉" }],
    isLoading: false,
  } as unknown as ReturnType<typeof useCategories>);

  mockedUseDistricts.mockReturnValue({
    data: ["西區", "北屯區"],
    isLoading: false,
  } as unknown as ReturnType<typeof useDistricts>);

  mockedUseRestaurantSearch.mockReturnValue({
    data: makePage(),
    isLoading: false,
  } as unknown as ReturnType<typeof useRestaurantSearch>);

  mockedUseRestaurantMapMarkers.mockReturnValue({
    data: [],
    isLoading: false,
  } as unknown as ReturnType<typeof useRestaurantMapMarkers>);
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

  it("切換「僅顯示有單人座位」會用 soloSeatOnly=true 重新呼叫搜尋 hook，並重置到第 1 頁", async () => {
    render(<Home />);

    const toggle = screen.getByRole("checkbox", {
      name: "僅顯示有單人座位",
    });
    await userEvent.click(toggle);

    expect(mockedUseRestaurantSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({ soloSeatOnly: true, city: "台中市", page: 1 }),
    );
  });

  it("選擇分類會用該分類名稱重新呼叫搜尋 hook，並重置到第 1 頁", async () => {
    render(<Home />);

    const select = screen.getByRole("combobox", { name: "分類" });
    await userEvent.selectOptions(select, "燒肉");

    expect(mockedUseRestaurantSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: "燒肉", page: 1 }),
    );
  });

  it("顯示行政區選項，選擇行政區會用該行政區重新呼叫搜尋 hook，並重置到第 1 頁", async () => {
    render(<Home />);

    expect(screen.getByRole("option", { name: "西區" })).toBeInTheDocument();

    const select = screen.getByRole("combobox", { name: "行政區" });
    await userEvent.selectOptions(select, "西區");

    expect(mockedUseRestaurantSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({ district: "西區", page: 1 }),
    );
  });

  it("沒有符合條件的餐廳時顯示空狀態文字", () => {
    mockedUseRestaurantSearch.mockReturnValue({
      data: makePage({ items: [], totalCount: 0, totalPages: 1 }),
      isLoading: false,
    } as unknown as ReturnType<typeof useRestaurantSearch>);

    render(<Home />);

    expect(
      screen.getByText("目前沒有符合條件的餐廳，換個篩選條件試試？"),
    ).toBeInTheDocument();
  });

  it("只有一頁時不顯示分頁按鈕", () => {
    render(<Home />);

    expect(screen.queryByLabelText("分頁")).not.toBeInTheDocument();
  });

  it("有多頁時顯示分頁按鈕，點選頁碼會用新的 page 重新呼叫搜尋 hook", async () => {
    mockedUseRestaurantSearch.mockReturnValue({
      data: makePage({ page: 1, totalPages: 3, totalCount: 25 }),
      isLoading: false,
    } as unknown as ReturnType<typeof useRestaurantSearch>);

    render(<Home />);

    expect(screen.getByLabelText("分頁")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "3" }));

    expect(mockedUseRestaurantSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 3 }),
    );
  });

  it("在第 1 頁時，上一頁按鈕是 disabled", () => {
    mockedUseRestaurantSearch.mockReturnValue({
      data: makePage({ page: 1, totalPages: 3, totalCount: 25 }),
      isLoading: false,
    } as unknown as ReturnType<typeof useRestaurantSearch>);

    render(<Home />);

    expect(screen.getByRole("button", { name: "上一頁" })).toBeDisabled();
  });
});

describe("首頁：店名搜尋", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("輸入店名，debounce 時間過後才會用 keyword 重新呼叫搜尋 hook，並重置到第 1 頁", () => {
    render(<Home />);

    const input = screen.getByRole("textbox", { name: "搜尋店名" });
    fireEvent.change(input, { target: { value: "燒肉" } });

    // debounce 還沒到，不應該已經用新的 keyword 呼叫
    expect(mockedUseRestaurantSearch).not.toHaveBeenLastCalledWith(
      expect.objectContaining({ keyword: "燒肉" }),
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockedUseRestaurantSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({ keyword: "燒肉", page: 1 }),
    );
  });
});

describe("首頁：列表/地圖切換", () => {
  it("預設是列表檢視，不會渲染地圖元件", () => {
    render(<Home />);

    expect(screen.getByText("測試燒肉店")).toBeInTheDocument();
    expect(screen.queryByTestId("restaurant-map-mock")).not.toBeInTheDocument();
  });

  it("點擊「地圖」會切換成地圖檢視，不再顯示餐廳清單", async () => {
    mockedUseRestaurantMapMarkers.mockReturnValue({
      data: [
        { id: "r1", name: "測試燒肉店", lat: 24.15, lng: 120.68, soloSeatStatus: "CONFIRMED_YES" },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useRestaurantMapMarkers>);

    render(<Home />);

    await userEvent.click(screen.getByRole("button", { name: "地圖" }));

    expect(await screen.findByTestId("restaurant-map-mock")).toHaveTextContent(
      "地圖 marker 數：1",
    );
    expect(screen.queryByText("台中市西區某路 1 號")).not.toBeInTheDocument();
  });

  it("切到地圖檢視時，useRestaurantMapMarkers 的 enabled 才會是 true", async () => {
    render(<Home />);

    expect(mockedUseRestaurantMapMarkers).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: false }),
    );

    await userEvent.click(screen.getByRole("button", { name: "地圖" }));

    expect(mockedUseRestaurantMapMarkers).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: true }),
    );
  });
});
