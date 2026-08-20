import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession, signIn, signOut } from "next-auth/react";
import ProfilePage from "@/app/profile/page";
import { useFavorites } from "@/hooks/useFavorites";
import { useToggleFavorite } from "@/hooks/useToggleFavorite";
import type { RestaurantSearchResultWithFriendliness } from "@/types/restaurant";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
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
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: vi.fn(() => ({
      favorite: { list: { invalidate: listInvalidate } },
    })),
  },
}));

const mockedUseSession = vi.mocked(useSession);
const mockedUseFavorites = vi.mocked(useFavorites);
const mockedUseToggleFavorite = vi.mocked(useToggleFavorite);

const favorite: RestaurantSearchResultWithFriendliness = {
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

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未登入時顯示登入提示，不查詢收藏清單", () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    } as unknown as ReturnType<typeof useSession>);
    mockedUseFavorites.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as unknown as ReturnType<typeof useFavorites>);

    render(<ProfilePage />);

    expect(
      screen.getByText("登入後即可查看個人頁面與收藏清單。"),
    ).toBeInTheDocument();
  });

  it("未登入時點擊登入按鈕會呼叫 signIn(\"google\")", async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    } as unknown as ReturnType<typeof useSession>);
    mockedUseFavorites.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as unknown as ReturnType<typeof useFavorites>);

    render(<ProfilePage />);
    await userEvent.click(screen.getByRole("button", { name: "登入" }));

    expect(signIn).toHaveBeenCalledWith("google");
  });

  it("已登入且沒有收藏時顯示使用者資訊與空清單提示", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { name: "小明", email: "ming@example.com", image: null } },
      status: "authenticated",
    } as unknown as ReturnType<typeof useSession>);
    mockedUseFavorites.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useFavorites>);

    render(<ProfilePage />);

    expect(screen.getByText("ming@example.com")).toBeInTheDocument();
    expect(
      screen.getByText("尚無收藏資料，去餐廳詳情頁點愛心加入收藏吧。"),
    ).toBeInTheDocument();
  });

  it("已登入且有收藏時顯示收藏清單，點擊「移除收藏」會呼叫 toggle mutation 並 invalidate 清單", async () => {
    mockedUseSession.mockReturnValue({
      data: { user: { name: "小明", email: "ming@example.com", image: null } },
      status: "authenticated",
    } as unknown as ReturnType<typeof useSession>);
    mockedUseFavorites.mockReturnValue({
      data: [favorite],
      isLoading: false,
    } as unknown as ReturnType<typeof useFavorites>);

    const mutate = vi.fn((_input, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    mockedUseToggleFavorite.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useToggleFavorite>);

    render(<ProfilePage />);

    expect(screen.getByText("測試燒肉店")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "移除收藏" }));

    expect(mutate).toHaveBeenCalledWith(
      { restaurantId: "r1" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(listInvalidate).toHaveBeenCalled();
  });

  it("已登入時頁面底部顯示登出按鈕，點擊會呼叫 signOut", async () => {
    mockedUseSession.mockReturnValue({
      data: { user: { name: "小明", email: "ming@example.com", image: null } },
      status: "authenticated",
    } as unknown as ReturnType<typeof useSession>);
    mockedUseFavorites.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useFavorites>);

    render(<ProfilePage />);
    await userEvent.click(screen.getByRole("button", { name: "登出" }));

    expect(signOut).toHaveBeenCalled();
  });
});
