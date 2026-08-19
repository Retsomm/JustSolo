import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { NavBar } from "@/components/NavBar";
import { THEME_STORAGE_KEY } from "@/lib/theme";

let changeListener: ((event: MediaQueryListEvent) => void) | null = null;

const mockMatchMedia = (prefersDark: boolean) => {
  changeListener = null;
  window.matchMedia = vi.fn().mockReturnValue({
    matches: prefersDark,
    media: "(prefers-color-scheme: dark)",
    addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
      changeListener = listener;
    },
    removeEventListener: () => {
      changeListener = null;
    },
  }) as unknown as typeof window.matchMedia;
};

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  mockMatchMedia(false);
});

afterEach(() => {
  vi.restoreAllMocks();
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

describe("NavBar hydration 穩定性", () => {
  it("系統偏好深色時，hydration 前後的初始 markup 一致（不觸發 mismatch），hydrate 後才依系統偏好更新", async () => {
    mockMatchMedia(true);

    // 真正模擬 Next.js 在 Node.js 伺服器端沒有 window 的情況（不是只靠
    // `typeof window === "undefined"` 這行程式碼本身，而是真的讓 renderToString
    // 執行時拿不到 window）——jsdom 測試環境預設全程都有 window，如果不這樣模擬，
    // 這個測試不會真的驗證到 SSR/CSR 分岔的情境。
    const realWindow = global.window;
    // @ts-expect-error 刻意刪除 window 來模擬伺服器環境
    delete global.window;
    let serverHtml: string;
    try {
      serverHtml = renderToString(<NavBar />);
    } finally {
      global.window = realWindow;
    }
    expect(serverHtml).toContain("切換成深色主題");

    const container = document.createElement("div");
    container.innerHTML = serverHtml;
    document.body.appendChild(container);

    // React 19 偵測到 hydration mismatch、且沒辦法用 patch 方式修復時
    // （例如整個子節點結構不同，這裡是太陽圖示換成月亮圖示），會非同步拋出例外、
    // 整棵樹在 client 端重新渲染——這個例外會晚於 act() 同步呼叫本身才浮現，
    // 一般的 `expect(() => act(...)).not.toThrow()` 抓不到，必須在 process
    // 層級監聽 uncaughtException/unhandledRejection 才能可靠偵測到。
    const uncaughtErrors: unknown[] = [];
    const handleUncaught = (error: unknown) => uncaughtErrors.push(error);
    process.on("uncaughtException", handleUncaught);
    process.on("unhandledRejection", handleUncaught);

    try {
      act(() => {
        hydrateRoot(container, <NavBar />);
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
    } finally {
      process.off("uncaughtException", handleUncaught);
      process.off("unhandledRejection", handleUncaught);
    }

    expect(uncaughtErrors).toHaveLength(0);

    // hydrate 完成後的 effect 會依照系統偏好（深色）更新畫面。
    expect(
      container.querySelector('[aria-label="切換成淺色主題"]'),
    ).not.toBeNull();

    document.body.removeChild(container);
  });
});

describe("NavBar 系統偏好變化訂閱", () => {
  it("掛載後系統偏好變化會即時更新主題", () => {
    render(<NavBar />);
    expect(
      screen.getByRole("button", { name: "切換成深色主題" }),
    ).toBeInTheDocument();

    act(() => {
      changeListener?.({ matches: true } as MediaQueryListEvent);
    });

    expect(
      screen.getByRole("button", { name: "切換成淺色主題" }),
    ).toBeInTheDocument();
  });

  it("手動選擇主題後，系統偏好變化不會覆蓋手動選擇", async () => {
    render(<NavBar />);
    await userEvent.click(
      screen.getByRole("button", { name: "切換成深色主題" }),
    );
    expect(
      screen.getByRole("button", { name: "切換成淺色主題" }),
    ).toBeInTheDocument();

    act(() => {
      changeListener?.({ matches: false } as MediaQueryListEvent);
    });

    expect(
      screen.getByRole("button", { name: "切換成淺色主題" }),
    ).toBeInTheDocument();
  });

  it("卸載時會取消訂閱系統偏好變化", () => {
    const { unmount } = render(<NavBar />);
    expect(changeListener).not.toBeNull();

    unmount();

    expect(changeListener).toBeNull();
  });
});
