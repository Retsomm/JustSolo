import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession, signIn } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";
import { NavBar } from "@/components/NavBar";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

const mockedUseSession = vi.mocked(useSession);
const mockedUsePathname = vi.mocked(usePathname);
const mockedUseSearchParams = vi.mocked(useSearchParams);

beforeEach(() => {
  mockedUseSession.mockReturnValue({
    data: null,
    status: "unauthenticated",
  } as unknown as ReturnType<typeof useSession>);
  mockedUsePathname.mockReturnValue("/");
  mockedUseSearchParams.mockReturnValue(
    new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>,
  );
});

describe("NavBar 登入", () => {
  it('未登入時顯示登入按鈕，點擊會呼叫 signIn("google")', async () => {
    render(<NavBar />);
    await userEvent.click(screen.getByRole("button", { name: "登入" }));

    expect(signIn).toHaveBeenCalledWith("google");
  });

  it("loading 狀態時不渲染登入按鈕，也不顯示收藏/我的連結", () => {
    mockedUseSession.mockReturnValue({
      data: null,
      status: "loading",
    } as unknown as ReturnType<typeof useSession>);

    render(<NavBar />);

    expect(screen.queryByRole("button", { name: "登入" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "我的" })).not.toBeInTheDocument();
  });
});

describe("NavBar 導覽連結", () => {
  it("首頁、地圖連結一律顯示", () => {
    render(<NavBar />);

    expect(screen.getByRole("link", { name: "首頁" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "地圖" })).toHaveAttribute(
      "href",
      "/map",
    );
  });

  it("未登入時不顯示收藏/我的連結", () => {
    render(<NavBar />);

    expect(screen.queryByRole("link", { name: "收藏" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "我的" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登入" })).toBeInTheDocument();
  });

  it("已登入時顯示收藏（連到 /profile?tab=favorites）與我的（連到 /profile）連結，不顯示登入按鈕", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { name: "小明" } },
      status: "authenticated",
    } as unknown as ReturnType<typeof useSession>);

    render(<NavBar />);

    expect(screen.getByRole("link", { name: "收藏" })).toHaveAttribute(
      "href",
      "/profile?tab=favorites",
    );
    expect(screen.getByRole("link", { name: "我的" })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(
      screen.queryByRole("button", { name: "登入" }),
    ).not.toBeInTheDocument();
  });

  it("已登入且在 /profile（無 tab 參數）時，「我的」標示 aria-current=page，「收藏」跟首頁都沒有", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { name: "小明" } },
      status: "authenticated",
    } as unknown as ReturnType<typeof useSession>);
    mockedUsePathname.mockReturnValue("/profile");

    render(<NavBar />);

    expect(screen.getByRole("link", { name: "我的" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "收藏" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByRole("link", { name: "首頁" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("已登入且在 /profile?tab=favorites 時，「收藏」標示 aria-current=page，「我的」沒有", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { name: "小明" } },
      status: "authenticated",
    } as unknown as ReturnType<typeof useSession>);
    mockedUsePathname.mockReturnValue("/profile");
    mockedUseSearchParams.mockReturnValue(
      new URLSearchParams("tab=favorites") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );

    render(<NavBar />);

    expect(screen.getByRole("link", { name: "收藏" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "我的" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
