import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession, signIn, signOut } from "next-auth/react";
import ProfilePage from "@/app/profile/page";
import { useFavorites } from "@/hooks/useFavorites";
import { useToggleFavorite } from "@/hooks/useToggleFavorite";
import type { PaginatedRestaurants } from "@/types/restaurant";

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

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseFavorites.mockReturnValue({
      data: makePaginated(),
      isLoading: false,
    } as unknown as ReturnType<typeof useFavorites>);
  });

  it("未登入時顯示登入提示", () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    } as unknown as ReturnType<typeof useSession>);

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

    render(<ProfilePage />);
    await userEvent.click(screen.getByRole("button", { name: "登入" }));

    expect(signIn).toHaveBeenCalledWith("google");
  });

  it("已登入時預設顯示「個人資料」分頁（信箱與登出按鈕），不是收藏清單", () => {
    mockedUseSession.mockReturnValue(signedInSession);

    render(<ProfilePage />);

    expect(screen.getByText("ming@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登出" })).toBeInTheDocument();
    expect(
      screen.queryByText("尚無收藏資料，去餐廳詳情頁點愛心加入收藏吧。"),
    ).not.toBeInTheDocument();
  });

  it("個人資料分頁點擊登出按鈕會呼叫 signOut", async () => {
    mockedUseSession.mockReturnValue(signedInSession);

    render(<ProfilePage />);
    await userEvent.click(screen.getByRole("button", { name: "登出" }));

    expect(signOut).toHaveBeenCalled();
  });

  it("切到「我的收藏」分頁，沒有收藏時顯示空清單提示", async () => {
    mockedUseSession.mockReturnValue(signedInSession);

    render(<ProfilePage />);
    await userEvent.click(screen.getByRole("tab", { name: "我的收藏" }));

    expect(
      screen.getByText("尚無收藏資料，去餐廳詳情頁點愛心加入收藏吧。"),
    ).toBeInTheDocument();
  });

  it("切到「我的收藏」分頁，有收藏時顯示清單，點擊「移除收藏」會呼叫 toggle mutation 並 invalidate 清單", async () => {
    mockedUseSession.mockReturnValue(signedInSession);
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

    render(<ProfilePage />);
    await userEvent.click(screen.getByRole("tab", { name: "我的收藏" }));

    expect(screen.getByText("測試燒肉店")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "移除收藏" }));

    expect(mutate).toHaveBeenCalledWith(
      { restaurantId: "r1" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(listInvalidate).toHaveBeenCalled();
  });

  it("收藏超過一頁時，「我的收藏」分頁會顯示分頁按鈕", async () => {
    mockedUseSession.mockReturnValue(signedInSession);
    mockedUseFavorites.mockReturnValue({
      data: makePaginated({
        items: [favorite],
        page: 1,
        totalCount: 12,
        totalPages: 2,
      }),
      isLoading: false,
    } as unknown as ReturnType<typeof useFavorites>);

    render(<ProfilePage />);
    await userEvent.click(screen.getByRole("tab", { name: "我的收藏" }));

    expect(screen.getByRole("navigation", { name: "分頁" })).toBeInTheDocument();
  });
});
