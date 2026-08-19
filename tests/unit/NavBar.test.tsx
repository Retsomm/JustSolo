import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NavBar } from "@/components/NavBar";
import { THEME_STORAGE_KEY } from "@/lib/theme";

const mockMatchMedia = (prefersDark: boolean) => {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: prefersDark,
    media: "(prefers-color-scheme: dark)",
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as typeof window.matchMedia;
};

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  mockMatchMedia(false);
});

describe("NavBar 主題切換", () => {
  it("沒有存過主題時，跟隨系統偏好（淺色），按鈕顯示切換成深色的選項", () => {
    render(<NavBar />);

    expect(
      screen.getByRole("button", { name: "切換成深色主題" }),
    ).toBeInTheDocument();
  });

  it("系統偏好深色、沒存過主題時，預設顯示深色", () => {
    mockMatchMedia(true);
    render(<NavBar />);

    expect(
      screen.getByRole("button", { name: "切換成淺色主題" }),
    ).toBeInTheDocument();
  });

  it("已存過 light，即使系統偏好深色也顯示淺色", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    mockMatchMedia(true);
    render(<NavBar />);

    expect(
      screen.getByRole("button", { name: "切換成深色主題" }),
    ).toBeInTheDocument();
  });

  it("點擊按鈕會切換主題、寫回 localStorage、並更新 <html> 的 data-theme", async () => {
    render(<NavBar />);

    const button = screen.getByRole("button", { name: "切換成深色主題" });
    await userEvent.click(button);

    expect(
      screen.getByRole("button", { name: "切換成淺色主題" }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
