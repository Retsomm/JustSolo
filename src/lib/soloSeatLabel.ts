import type { SoloSeatStatus } from "@/types/restaurant";

export const soloSeatStatusLabel = (status: SoloSeatStatus): string => {
  switch (status) {
    case "CONFIRMED_YES":
      return "已確認有單人座位";
    case "CONFIRMED_NO":
      return "已確認無單人座位";
    case "UNKNOWN":
      return "尚未確認，建議致電詢問";
  }
};
