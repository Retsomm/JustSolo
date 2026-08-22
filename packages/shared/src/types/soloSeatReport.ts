import { z } from "zod";

export const createSoloSeatReportInputSchema = z.object({
  restaurantId: z.string(),
  reportType: z.enum(["CONFIRMED_YES", "CONFIRMED_NO"]),
  note: z.string().max(200).optional(),
});

export type CreateSoloSeatReportInput = z.infer<
  typeof createSoloSeatReportInputSchema
>;

// 只帶 restaurantId 的輸入，getMine（查詢）跟 delete（刪除）共用同一個形狀。
export const soloSeatReportByRestaurantInputSchema = z.object({
  restaurantId: z.string(),
});

export type SoloSeatReportByRestaurantInput = z.infer<
  typeof soloSeatReportByRestaurantInputSchema
>;

// 使用者自己對某間餐廳的回報，用來讓表單分辨「第一次新增」跟「編輯既有回報」、
// 並把先前填的備註顯示回畫面上（不只是送出後就消失在使用者眼前）。
export type MySoloSeatReport = {
  reportType: "CONFIRMED_YES" | "CONFIRMED_NO";
  note: string | null;
} | null;
