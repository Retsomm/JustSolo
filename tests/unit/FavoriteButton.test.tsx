import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession, signIn } from "next-auth/react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useFavoriteStatus } from "@/hooks/useFavoriteStatus";
import { useToggleFavorite } from "@/hooks/useToggleFavorite";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("@/hooks/useFavoriteStatus");
vi.mock("@/hooks/useToggleFavorite");

const isFavoritedInvalidate = vi.fn();
const listInvalidate = vi.fn();
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: vi.fn(() => ({
      favorite: {
        isFavorited: { invalidate: isFavoritedInvalidate },
        list: { invalidate: listInvalidate },
      },
    })),
  },
}));

const mockedUseSession = vi.mocked(useSession);
const mockedUseFavoriteStatus = vi.mocked(useFavoriteStatus);
const mockedUseToggleFavorite = vi.mocked(useToggleFavorite);

describe("FavoriteButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未登入時點擊會呼叫 signIn(\"google\")，不查詢收藏狀態", async () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    } as unknown as ReturnType<typeof useSession>);
    mockedUseFavoriteStatus.mockReturnValue({
      data: undefined,
    } as unknown as ReturnType<typeof useFavoriteStatus>);

    render(<FavoriteButton restaurantId="r1" />);
    await userEvent.click(screen.getByRole("button"));

    expect(signIn).toHaveBeenCalledWith("google");
  });

  it("已登入且尚未收藏時，點擊會呼叫 toggle mutation 並帶正確參數", async () => {
    mockedUseSession.mockReturnValue({
      data: { user: { name: "小明" } },
      status: "authenticated",
    } as unknown as ReturnType<typeof useSession>);
    mockedUseFavoriteStatus.mockReturnValue({
      data: false,
    } as unknown as ReturnType<typeof useFavoriteStatus>);

    const mutate = vi.fn((_input, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    mockedUseToggleFavorite.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useToggleFavorite>);

    render(<FavoriteButton restaurantId="r1" />);
    expect(screen.getByRole("button", { name: "加入收藏" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "加入收藏" }));

    expect(mutate).toHaveBeenCalledWith(
      { restaurantId: "r1" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(isFavoritedInvalidate).toHaveBeenCalledWith({ restaurantId: "r1" });
    expect(listInvalidate).toHaveBeenCalled();
  });

  it("已收藏時顯示「取消收藏」的 aria-label", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { name: "小明" } },
      status: "authenticated",
    } as unknown as ReturnType<typeof useSession>);
    mockedUseFavoriteStatus.mockReturnValue({
      data: true,
    } as unknown as ReturnType<typeof useFavoriteStatus>);
    mockedUseToggleFavorite.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useToggleFavorite>);

    render(<FavoriteButton restaurantId="r1" />);

    expect(screen.getByRole("button", { name: "取消收藏" })).toBeInTheDocument();
  });
});
