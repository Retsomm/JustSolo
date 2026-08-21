// 色票/字型/圓角/間距全部對照 ui-app 設計稿的 Organic 設計系統
// （apps/web/ui-app/project/_ds/organic-*/styles.css），深色模式數值取自
// App.dc.html 裡手機版 App 本身的 dark 分支（那份設計系統 CSS 本身沒有內建
// dark theme，是 App.dc.html 用 state 手動切換這幾個 token）。

export const OrganicColors = {
  light: {
    bg: "#f5ead8",
    surface: "#ebddc5",
    text: "#201e1d",
    textSecondary: "#5c5852",
    cardBg: "#f5ead8",
    border: "#dcd3c4",
    accent: "#c67139",
    accentText: "#f5ead8",
    accentTint: "#fff2eb",
    accentTintText: "#643312",
    accent2: "#7a8a5e",
    accent2Tint: "#f0fae1",
    accent2TintText: "#3d472b",
    neutralTint: "#f9f4ed",
    neutralTintText: "#474238",
    tabActive: "#8c491a",
    tabInactive: "#a19786",
    // 跟網頁版 globals.css 的 --danger token 同一組數值（light/dark 各自一個），
    // 不是另外挑的顏色。
    danger: "#b3401f",
  },
  dark: {
    bg: "#2e2b25",
    surface: "#474238",
    text: "#f9f4ed",
    textSecondary: "#c0b6a5",
    cardBg: "#474238",
    border: "#645c50",
    accent: "#c67139",
    accentText: "#2e2b25",
    accentTint: "#402310",
    accentTintText: "#ffc6a5",
    accent2: "#8fa073",
    accent2Tint: "#272e1b",
    accent2TintText: "#ccdbb2",
    neutralTint: "#3d3a33",
    neutralTintText: "#dcd3c4",
    tabActive: "#f6a06b",
    tabInactive: "#a19786",
    danger: "#f0733d",
  },
} as const;

export type OrganicColorScheme = keyof typeof OrganicColors;

export const OrganicRadius = {
  sm: 8,
  md: 16,
  lg: 32, // 設計稿 card/.dialog 用 radius-lg * 1.15
  pill: 999, // .btn/.tag/.seg/.input 都是全圓角
};

export const OrganicSpacing = {
  1: 4,
  2: 9,
  3: 13,
  4: 18,
  6: 26,
  8: 35,
};

export const FontFamily = {
  heading: "Caprasimo_400Regular",
  body: "Figtree_400Regular",
  bodyMedium: "Figtree_600SemiBold",
  bodyBold: "Figtree_700Bold",
};
