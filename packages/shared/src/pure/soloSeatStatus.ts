import type { SoloSeatStatus } from "../types/restaurant";

const CONFIRM_THRESHOLD = 0.6;
const DENY_THRESHOLD = 0.4;
const MIN_REPORTS_TO_DECIDE = 2;

// 純函式：只看 CONFIRMED_YES/CONFIRMED_NO 兩種回報型別，UNKNOWN 不是使用者可選的回報值，
// 不列入計算。回報數未達門檻前先不下定論（避免單一使用者一票就洗成定論），但 confidence
// 仍照比例回傳供前端顯示參考值。
export const computeSoloSeatStatus = (
  reportTypes: SoloSeatStatus[],
): { status: SoloSeatStatus; confidence: number } => {
  const yes = reportTypes.filter((t) => t === "CONFIRMED_YES").length;
  const no = reportTypes.filter((t) => t === "CONFIRMED_NO").length;
  const total = yes + no;

  if (total === 0) return { status: "UNKNOWN", confidence: 0 };

  const confidence = yes / total;

  if (total < MIN_REPORTS_TO_DECIDE) {
    return { status: "UNKNOWN", confidence };
  }
  if (confidence >= CONFIRM_THRESHOLD) {
    return { status: "CONFIRMED_YES", confidence };
  }
  if (confidence <= DENY_THRESHOLD) {
    return { status: "CONFIRMED_NO", confidence };
  }
  return { status: "UNKNOWN", confidence };
};
