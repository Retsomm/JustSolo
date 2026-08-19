export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

// 純函式：決定目前該套用哪個主題。優先順序：使用者手動選過的（存在 localStorage/
// data-theme 屬性裡）> 系統的深色模式偏好 > 預設淺色。方便單元測試，不用真的碰
// localStorage/matchMedia。
export const resolveTheme = (
  storedTheme: string | null,
  prefersDark: boolean,
): Theme => {
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  return prefersDark ? "dark" : "light";
};

// 純函式：切換到另一個主題。
export const toggleTheme = (current: Theme): Theme =>
  current === "dark" ? "light" : "dark";
