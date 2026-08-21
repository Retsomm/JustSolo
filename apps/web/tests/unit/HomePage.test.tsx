import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";
import { useCategories } from "@/hooks/useCategories";
import { useDistricts } from "@/hooks/useDistricts";
import { useRestaurantPick } from "@/hooks/useRestaurantPick";
import { useRestaurantSearch } from "@/hooks/useRestaurantSearch";
import { useRestaurantPlaceDetails } from "@/hooks/useRestaurantPlaceDetails";
import type {
  PaginatedRestaurants,
  RestaurantPick,
  RestaurantSearchResultWithFriendliness,
} from "@justsolo/shared";

vi.mock("@/hooks/useCategories");
vi.mock("@/hooks/useDistricts");
vi.mock("@/hooks/useRestaurantPick");
vi.mock("@/hooks/useRestaurantSearch");
vi.mock("@/hooks/useRestaurantPlaceDetails");
// 收藏按鈕本身有自己的測試（FavoriteButton.test.tsx），這裡用 stub 避免要另外準備
// SessionProvider/tRPC Provider。
vi.mock("@/components/FavoriteButton", () => ({
  FavoriteButton: () => null,
}));

const mockedUseCategories = vi.mocked(useCategories);
const mockedUseDistricts = vi.mocked(useDistricts);
const mockedUseRestaurantPick = vi.mocked(useRestaurantPick);
const mockedUseRestaurantSearch = vi.mocked(useRestaurantSearch);
const mockedUseRestaurantPlaceDetails = vi.mocked(useRestaurantPlaceDetails);

const soloSeatYesRestaurant: RestaurantSearchResultWithFriendliness = {
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
  soloSeatConfidence: 0.8,
  soloFriendlinessScore: 94,
  soloFriendlinessLabel: "非常適合單人",
};

const makePick = (overrides: Partial<RestaurantPick> = {}): RestaurantPick => ({
  restaurant: soloSeatYesRestaurant,
  totalCount: 1,
  ...overrides,
});

const makeSearchPage = (
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

  mockedUseRestaurantPick.mockReturnValue({
    data: makePick(),
    isLoading: false,
  } as unknown as ReturnType<typeof useRestaurantPick>);

  mockedUseRestaurantSearch.mockReturnValue({
    data: makeSearchPage(),
    isLoading: false,
  } as unknown as ReturnType<typeof useRestaurantSearch>);

  mockedUseRestaurantPlaceDetails.mockReturnValue({
    data: undefined,
    isLoading: false,
  } as unknown as ReturnType<typeof useRestaurantPlaceDetails>);
});

describe("首頁", () => {
  it("顯示目前推薦的餐廳卡片（含單人座位狀態文字與友善度徽章）", () => {
    render(<Home />);

    expect(screen.getByText("測試燒肉店")).toBeInTheDocument();
    expect(screen.getByText(/台中市西區某路 1 號/)).toBeInTheDocument();
    expect(screen.getByText(/已確認有單人座位/)).toBeInTheDocument();
    expect(screen.getByText("非常適合單人")).toBeInTheDocument();
  });

  it("篩選條件面板預設收合，點擊「篩選條件」才會展開", async () => {
    render(<Home />);

    expect(
      screen.queryByRole("textbox", { name: "搜尋店名" }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /篩選條件/ }));

    expect(
      screen.getByRole("textbox", { name: "搜尋店名" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "燒肉" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "西區" })).toBeInTheDocument();
  });

  it("選擇分類會用該分類名稱重新呼叫 pick hook，並清空已排除清單", async () => {
    render(<Home />);
    await userEvent.click(screen.getByRole("button", { name: /篩選條件/ }));

    const select = screen.getByRole("combobox", { name: "分類" });
    await userEvent.selectOptions(select, "燒肉");

    expect(mockedUseRestaurantPick).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: "燒肉", excludeIds: [] }),
    );
  });

  it("選擇行政區會用該行政區重新呼叫 pick hook", async () => {
    render(<Home />);
    await userEvent.click(screen.getByRole("button", { name: /篩選條件/ }));

    const select = screen.getByRole("combobox", { name: "行政區" });
    await userEvent.selectOptions(select, "西區");

    expect(mockedUseRestaurantPick).toHaveBeenLastCalledWith(
      expect.objectContaining({ district: "西區", excludeIds: [] }),
    );
  });

  it("切換「僅顯示有單人座位」會用 soloSeatOnly=true 重新呼叫 pick hook", async () => {
    render(<Home />);
    await userEvent.click(screen.getByRole("button", { name: /篩選條件/ }));

    await userEvent.click(
      screen.getByRole("checkbox", { name: "僅顯示有單人座位" }),
    );

    expect(mockedUseRestaurantPick).toHaveBeenLastCalledWith(
      expect.objectContaining({ soloSeatOnly: true }),
    );
  });

  it("點擊「換一家」會把目前餐廳 id 加進排除清單，重新呼叫 pick hook", async () => {
    render(<Home />);

    await userEvent.click(screen.getByRole("button", { name: /換一家/ }));

    expect(mockedUseRestaurantPick).toHaveBeenLastCalledWith(
      expect.objectContaining({ excludeIds: ["r1"] }),
    );
  });

  it("「前往看看」連到餐廳詳情頁", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: /前往看看/ })).toHaveAttribute(
      "href",
      "/restaurant/r1",
    );
  });

  it("沒有符合條件的餐廳時顯示空狀態文字", () => {
    mockedUseRestaurantPick.mockReturnValue({
      data: makePick({ restaurant: null, totalCount: 0 }),
      isLoading: false,
    } as unknown as ReturnType<typeof useRestaurantPick>);

    render(<Home />);

    expect(
      screen.getByText("目前沒有符合條件的餐廳，換個篩選條件試試？"),
    ).toBeInTheDocument();
  });
});

describe("首頁：店名搜尋", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("輸入店名，debounce 時間過後才會用 keyword 重新呼叫 pick hook", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /篩選條件/ }));

    const input = screen.getByRole("textbox", { name: "搜尋店名" });
    fireEvent.change(input, { target: { value: "燒肉" } });

    expect(mockedUseRestaurantPick).not.toHaveBeenLastCalledWith(
      expect.objectContaining({ keyword: "燒肉" }),
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockedUseRestaurantPick).toHaveBeenLastCalledWith(
      expect.objectContaining({ keyword: "燒肉", excludeIds: [] }),
    );
  });
});

describe("首頁：完整列表", () => {
  it("預設收合，顯示含篩選後總數的展開按鈕", () => {
    render(<Home />);

    expect(
      screen.getByRole("button", { name: "或查看完整列表（1 家）" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("分頁")).not.toBeInTheDocument();
  });

  it("點擊展開按鈕後顯示完整列表，且 useRestaurantSearch 的 enabled 變成 true", async () => {
    render(<Home />);

    expect(mockedUseRestaurantSearch).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: false }),
    );

    await userEvent.click(
      screen.getByRole("button", { name: "或查看完整列表（1 家）" }),
    );

    expect(mockedUseRestaurantSearch).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: true }),
    );
    expect(
      screen.getByRole("button", { name: "收起完整列表" }),
    ).toBeInTheDocument();
  });

  it("有多頁時展開列表會顯示分頁按鈕，點選頁碼會用新的 page 重新呼叫搜尋 hook", async () => {
    mockedUseRestaurantSearch.mockReturnValue({
      data: makeSearchPage({ page: 1, totalPages: 3, totalCount: 25 }),
      isLoading: false,
    } as unknown as ReturnType<typeof useRestaurantSearch>);

    render(<Home />);
    await userEvent.click(
      screen.getByRole("button", { name: /或查看完整列表/ }),
    );

    expect(screen.getByLabelText("分頁")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "3" }));

    expect(mockedUseRestaurantSearch).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 3 }),
      expect.anything(),
    );
  });
});
