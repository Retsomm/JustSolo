import { describe, expect, it } from "vitest";
import { resolveTheme, toggleTheme } from "@/lib/theme";

describe("resolveTheme", () => {
  it("有存過 light 就用 light，不管系統偏好是什麼", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("light", false)).toBe("light");
  });

  it("有存過 dark 就用 dark，不管系統偏好是什麼", () => {
    expect(resolveTheme("dark", true)).toBe("dark");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("沒存過（null）時跟隨系統偏好", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(null, false)).toBe("light");
  });

  it("存的值不是合法主題時，當作沒存過，跟隨系統偏好", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("garbage", false)).toBe("light");
  });
});

describe("toggleTheme", () => {
  it("dark 切換成 light", () => {
    expect(toggleTheme("dark")).toBe("light");
  });

  it("light 切換成 dark", () => {
    expect(toggleTheme("light")).toBe("dark");
  });
});
