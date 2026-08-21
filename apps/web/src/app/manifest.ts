import type { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => {
  return {
    name: "JustSolo | 一人友善餐廳搜尋",
    short_name: "JustSolo",
    description: "幫 I 人找到真的有單人座位的餐廳，燒肉、中式、牛排、甜點通通找得到",
    start_url: "/",
    display: "standalone",
    background_color: "#f5ead8",
    theme_color: "#b2622d",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
};

export default manifest;
