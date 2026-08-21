import { submitSoloSeatReportTransaction } from "../clients/prismaClient";
import { computeSoloSeatStatus } from "../../pure/soloSeatStatus";
import type { CreateSoloSeatReportInput } from "../../types/soloSeatReport";

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
