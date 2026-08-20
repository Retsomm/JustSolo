import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  listSoloSeatReportTypes,
  updateRestaurantSoloSeatStatus,
  upsertSoloSeatReport,
} from "@/server/clients/prismaClient";
import {
  computeSoloSeatStatus,
  submitSoloSeatReport,
} from "@/server/services/soloSeatReportService";

vi.mock("@/server/clients/prismaClient", () => ({
  listSoloSeatReportTypes: vi.fn(),
  updateRestaurantSoloSeatStatus: vi.fn(),
  upsertSoloSeatReport: vi.fn(),
}));

const mockedListSoloSeatReportTypes = vi.mocked(listSoloSeatReportTypes);
const mockedUpdateRestaurantSoloSeatStatus = vi.mocked(
  updateRestaurantSoloSeatStatus,
);
const mockedUpsertSoloSeatReport = vi.mocked(upsertSoloSeatReport);

describe("computeSoloSeatStatus", () => {
  it("沒有回報時回傳 UNKNOWN、confidence 0", () => {
    expect(computeSoloSeatStatus([])).toEqual({
      status: "UNKNOWN",
      confidence: 0,
    });
  });

  it("只有 1 筆回報時，即使是同向也還不下定論（避免單一使用者洗成定論）", () => {
    expect(computeSoloSeatStatus(["CONFIRMED_YES"])).toEqual({
      status: "UNKNOWN",
      confidence: 1,
    });
  });

  it("2 筆同向且達門檻（>=0.6）時判定 CONFIRMED_YES", () => {
    expect(
      computeSoloSeatStatus(["CONFIRMED_YES", "CONFIRMED_YES"]),
    ).toEqual({ status: "CONFIRMED_YES", confidence: 1 });
  });

  it("2 筆同向且達門檻（<=0.4）時判定 CONFIRMED_NO", () => {
    expect(computeSoloSeatStatus(["CONFIRMED_NO", "CONFIRMED_NO"])).toEqual({
      status: "CONFIRMED_NO",
      confidence: 0,
    });
  });

  it("平手（confidence 0.5）時維持 UNKNOWN", () => {
    expect(
      computeSoloSeatStatus(["CONFIRMED_YES", "CONFIRMED_NO"]),
    ).toEqual({ status: "UNKNOWN", confidence: 0.5 });
  });

  it("confidence 剛好等於 0.6 時判定 CONFIRMED_YES（含邊界）", () => {
    expect(
      computeSoloSeatStatus([
        "CONFIRMED_YES",
        "CONFIRMED_YES",
        "CONFIRMED_YES",
        "CONFIRMED_NO",
        "CONFIRMED_NO",
      ]),
    ).toEqual({ status: "CONFIRMED_YES", confidence: 0.6 });
  });

  it("confidence 剛好等於 0.4 時判定 CONFIRMED_NO（含邊界）", () => {
    expect(
      computeSoloSeatStatus([
        "CONFIRMED_NO",
        "CONFIRMED_NO",
        "CONFIRMED_NO",
        "CONFIRMED_YES",
        "CONFIRMED_YES",
      ]),
    ).toEqual({ status: "CONFIRMED_NO", confidence: 0.4 });
  });
});

describe("submitSoloSeatReport", () => {
  beforeEach(() => {
    mockedUpsertSoloSeatReport.mockReset().mockResolvedValue(undefined);
    mockedListSoloSeatReportTypes.mockReset().mockResolvedValue([]);
    mockedUpdateRestaurantSoloSeatStatus
      .mockReset()
      .mockResolvedValue(undefined);
  });

  // 比照 restaurantSearchService.ts 已經踩過的坑：組合層轉呼叫 Client 的地方
  // 容易漏傳欄位，這裡直接斷言四個 Client 呼叫都有拿到完整參數。
  it("把回報寫入、重算信心分數、寫回 Restaurant，且每個欄位都完整轉呼叫", async () => {
    mockedListSoloSeatReportTypes.mockResolvedValue([
      "CONFIRMED_YES",
      "CONFIRMED_YES",
    ]);

    await submitSoloSeatReport({
      restaurantId: "r1",
      userId: "u1",
      reportType: "CONFIRMED_YES",
      note: "吧台有單人座",
    });

    expect(mockedUpsertSoloSeatReport).toHaveBeenCalledWith({
      restaurantId: "r1",
      userId: "u1",
      reportType: "CONFIRMED_YES",
      note: "吧台有單人座",
    });
    expect(mockedListSoloSeatReportTypes).toHaveBeenCalledWith("r1");
    expect(mockedUpdateRestaurantSoloSeatStatus).toHaveBeenCalledWith(
      "r1",
      "CONFIRMED_YES",
      1,
    );
  });

  it("note 是 undefined 時轉呼叫 null，不是 undefined", async () => {
    await submitSoloSeatReport({
      restaurantId: "r1",
      userId: "u1",
      reportType: "CONFIRMED_NO",
    });

    expect(mockedUpsertSoloSeatReport).toHaveBeenCalledWith({
      restaurantId: "r1",
      userId: "u1",
      reportType: "CONFIRMED_NO",
      note: null,
    });
  });
});
