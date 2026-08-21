import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession, signIn, signOut } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { ProfileView } from "@/app/profile/ProfileView";
import { useFavorites } from "@/hooks/useFavorites";
import { useToggleFavorite } from "@/hooks/useToggleFavorite";
import type { PaginatedRestaurants } from "@justsolo/shared";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

vi.mock("@/hooks/useFavorites");
vi.mock("@/hooks/useToggleFavorite");
// AvatarUploader/EditableName 本身各自有自己的測試（AvatarUploader.test.tsx/
// EditableName.test.tsx），這裡用 stub 避免要另外準備 react-easy-crop/tRPC mutation mock。
vi.mock("@/components/AvatarUploader", () => ({
  AvatarUploader: () => null,
}));
vi.mock("@/components/EditableName", () => ({
  EditableName: () => null,
}));

const listInvalidate = vi.fn();
const isFavoritedInvalidate = vi.fn();
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: vi.fn(() => ({
      favorite: {
        list: { invalidate: listInvalidate },
        isFavorited: { invalidate: isFavoritedInvalidate },
      },
    })),
  },
}));

const mockedUseSession = vi.mocked(useSession);
const mockedUseSearchParams = vi.mocked(useSearchParams);
const mockedUseFavorites = vi.mocked(useFavorites);
const mockedUseToggleFavorite = vi.mocked(useToggleFavorite);

const favorite: PaginatedRestaurants["items"][number] = {
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
  soloSeatConfidence: 1,
  soloFriendlinessScore: 90,
  soloFriendlinessLabel: "非常適合單人",
};

const makePaginated = (
  overrides: Partial<PaginatedRestaurants> = {},
): PaginatedRestaurants => ({
  items: [],
  page: 1,
  pageSize: 10,
  totalCount: 0,
  totalPages: 1,
  ...overrides,
});

const signedInSession = {
  data: { user: { name: "小明", email: "ming@example.com", image: null } },
  status: "authenticated",
} as unknown as ReturnType<typeof useSession>;

const useFavoritesSearchParams = () =>
  mockedUseSearchParams.mockReturnValue(
    new URLSearchParams("tab=favorites") as unknown as ReturnType<
      typeof useSearchParams
    >,
  );

describe("ProfileView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseFavorites.mockReturnValue({
      data: makePaginated(),
      isLoading: false,
    } as unknown as ReturnType<typeof useFavorites>);
    mockedUseSearchParams.mockReturnValue(
      new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>,
    );
  });

  it("未登入時顯示登入提示", () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    } as unknown as ReturnType<typeof useSession>);

    render(<ProfileView />);

    expect(
      screen.getByText("登入後即可查看個人頁面與收藏清單。"),
    ).toBeInTheDocument();
  });

  it('未登入時點擊登入按鈕會呼叫 signIn("google")', async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    } as unknown as ReturnType<typeof useSession>);

    render(<ProfileView />);
    await userEvent.click(screen.getByRole("button", { name: "登入" }));

    expect(signIn).toHaveBeenCalledWith("google");
  });

  it("已登入時，/profile（無 tab 參數）只顯示個人資料（信箱、登出按鈕與主題切換按鈕），不顯示收藏清單", () => {
    mockedUseSession.mockReturnValue(signedInSession);

    render(<ProfileView />);

    expect(screen.getByText("ming@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登出" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /切換成.*主題/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("尚無收藏資料，去餐廳詳情頁點愛心加入收藏吧。"),
    ).not.toBeInTheDocument();
  });

  it("已登入時，網址帶 ?tab=favorites 只顯示收藏清單，不顯示個人資料", () => {
    mockedUseSession.mockReturnValue(signedInSession);
    useFavoritesSearchParams();

    render(<ProfileView />);

    expect(
      screen.getByText("尚無收藏資料，去餐廳詳情頁點愛心加入收藏吧。"),
    ).toBeInTheDocument();
    expect(screen.queryByText("ming@example.com")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "登出" }),
    ).not.toBeInTheDocument();
  });

  it("個人資料頁點擊登出按鈕會呼叫 signOut", async () => {
    mockedUseSession.mockReturnValue(signedInSession);

    render(<ProfileView />);
    await userEvent.click(screen.getByRole("button", { name: "登出" }));

    expect(signOut).toHaveBeenCalled();
  });

  it("個人資料頁點擊主題切換按鈕會更新 <html> 的 data-theme", async () => {
    mockedUseSession.mockReturnValue(signedInSession);

    render(<ProfileView />);
    const button = screen.getByRole("button", { name: /切換成深色主題/ });
    await userEvent.click(button);

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(
      screen.getByRole("button", { name: "切換成淺色主題" }),
    ).toBeInTheDocument();
  });

  it("/profile?tab=favorites，沒有收藏時顯示空清單提示", () => {
    mockedUseSession.mockReturnValue(signedInSession);
    useFavoritesSearchParams();

    render(<ProfileView />);

    expect(
      screen.getByText("尚無收藏資料，去餐廳詳情頁點愛心加入收藏吧。"),
    ).toBeInTheDocument();
  });

  it("/profile?tab=favorites，有收藏時顯示清單與收藏總數，點擊「移除收藏」會呼叫 toggle mutation 並 invalidate 清單", async () => {
    mockedUseSession.mockReturnValue(signedInSession);
    useFavoritesSearchParams();
    mockedUseFavorites.mockReturnValue({
      data: makePaginated({ items: [favorite], totalCount: 1 }),
      isLoading: false,
    } as unknown as ReturnType<typeof useFavorites>);

    const mutate = vi.fn((_input, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    mockedUseToggleFavorite.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useToggleFavorite>);

    render(<ProfileView />);

    expect(screen.getByText("收藏了 1 個安心去處")).toBeInTheDocument();
    expect(screen.getByText("測試燒肉店")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "移除收藏" }));

    expect(mutate).toHaveBeenCalledWith(
      { restaurantId: "r1", isFavorited: false },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(isFavoritedInvalidate).toHaveBeenCalledWith({ restaurantId: "r1" });
    expect(listInvalidate).toHaveBeenCalled();
  });

  it("收藏超過一頁時，會顯示分頁按鈕", () => {
    mockedUseSession.mockReturnValue(signedInSession);
    useFavoritesSearchParams();
    mockedUseFavorites.mockReturnValue({
      data: makePaginated({
        items: [favorite],
        page: 1,
        totalCount: 12,
        totalPages: 2,
      }),
      isLoading: false,
    } as unknown as ReturnType<typeof useFavorites>);

    render(<ProfileView />);

    expect(screen.getByRole("navigation", { name: "分頁" })).toBeInTheDocument();
  });

  it("在 /profile（個人資料頁）時，useFavorites 的 enabled 是 false，不會打收藏 API", () => {
    mockedUseSession.mockReturnValue(signedInSession);

    render(<ProfileView />);

    expect(mockedUseFavorites).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({ enabled: false }),
    );
  });
});
