import {
  deleteSoloSeatReportTransaction,
  findSoloSeatReportByUserAndRestaurant,
  submitSoloSeatReportTransaction,
} from "../clients/prismaClient";
import { computeSoloSeatStatus } from "../../pure/soloSeatStatus";
import type {
  CreateSoloSeatReportInput,
  MySoloSeatReport,
} from "../../types/soloSeatReport";

// 組合層：寫入回報、重算信心分數、寫回 Restaurant 三步包在 Client 層的同一個
// transaction 裡（鎖住該餐廳 row 序列化並行回報，避免兩個使用者同時回報時
// aggregate 算錯，見 prismaClient.ts 的 submitSoloSeatReportTransaction）。
// 每次都重新整批計算（不是遞增），避免併發下算錯。
export const submitSoloSeatReport = async (
  input: CreateSoloSeatReportInput & { userId: string },
): Promise<void> => {
  await submitSoloSeatReportTransaction({
    restaurantId: input.restaurantId,
    userId: input.userId,
    reportType: input.reportType,
    note: input.note ?? null,
    computeStatus: computeSoloSeatStatus,
  });
};

// reportType 在 DB 裡的欄位型別是完整的 SoloSeatStatus（含 UNKNOWN），但寫入
// 路徑（submitSoloSeatReport）只接受 CONFIRMED_YES/CONFIRMED_NO，UNKNOWN 不可能
// 出現在既有的回報紀錄裡，這裡窄化型別讓前端不用處理不可能發生的第三種狀態。
export const getMySoloSeatReport = async (
  userId: string,
  restaurantId: string,
): Promise<MySoloSeatReport> => {
  const report = await findSoloSeatReportByUserAndRestaurant(userId, restaurantId);
  if (!report || report.reportType === "UNKNOWN") return null;

  return { reportType: report.reportType, note: report.note };
};

// 組合層：刪除回報、重算信心分數、寫回 Restaurant 三步包在 Client 層的同一個
// transaction 裡，理由跟 submitSoloSeatReport 一樣，見
// prismaClient.ts 的 deleteSoloSeatReportTransaction。
export const deleteSoloSeatReport = async (
  userId: string,
  restaurantId: string,
): Promise<void> => {
  await deleteSoloSeatReportTransaction({
    restaurantId,
    userId,
    computeStatus: computeSoloSeatStatus,
  });
};
