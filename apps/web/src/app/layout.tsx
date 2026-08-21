import type { Metadata, Viewport } from "next";
import { Caprasimo, Figtree } from "next/font/google";
import { Providers } from "./providers";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

const caprasimo = Caprasimo({
  variable: "--font-caprasimo",
  weight: "400",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JustSolo | 一人友善餐廳搜尋",
  description: "幫 I 人找到真的有單人座位的餐廳，燒肉、中式、牛排、甜點通通找得到",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JustSolo",
  },
};

export const viewport: Viewport = {
  themeColor: "#b2622d",
};

// 在畫面第一次繪製前先套用使用者手動選過的主題（讀 localStorage），
// 避免「先閃一下錯的主題、React hydrate 後才變成對的」這種畫面閃爍。
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant"
      className={`${caprasimo.variable} ${figtree.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <NavBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
