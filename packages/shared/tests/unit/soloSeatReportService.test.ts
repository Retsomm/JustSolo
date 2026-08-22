import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  deleteSoloSeatReportTransaction,
  findSoloSeatReportByUserAndRestaurant,
  submitSoloSeatReportTransaction,
} from "@/server/clients/prismaClient";
import { computeSoloSeatStatus } from "@/pure/soloSeatStatus";
import {
  deleteSoloSeatReport,
  getMySoloSeatReport,
  submitSoloSeatReport,
} from "@/server/services/soloSeatReportService";

vi.mock("@/server/clients/prismaClient", () => ({
  submitSoloSeatReportTransaction: vi.fn(),
  findSoloSeatReportByUserAndRestaurant: vi.fn(),
  deleteSoloSeatReportTransaction: vi.fn(),
}));

const mockedSubmitSoloSeatReportTransaction = vi.mocked(
  submitSoloSeatReportTransaction,
);
const mockedFindSoloSeatReportByUserAndRestaurant = vi.mocked(
  findSoloSeatReportByUserAndRestaurant,
);
const mockedDeleteSoloSeatReportTransaction = vi.mocked(
  deleteSoloSeatReportTransaction,
);

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
    mockedSubmitSoloSeatReportTransaction.mockReset().mockResolvedValue(
      undefined,
    );
  });

  // 比照 restaurantSearchService.ts 已經踩過的坑：組合層轉呼叫 Client 的地方
  // 容易漏傳欄位，這裡直接斷言轉呼叫 Client transaction 函式時每個欄位都完整，
  // 且傳入的 computeStatus callback 就是真正的純函式（而非另一份邏輯）。
  it("把回報資料轉呼叫 Client 層的 transaction 函式，且每個欄位都完整轉呼叫", async () => {
    await submitSoloSeatReport({
      restaurantId: "r1",
      userId: "u1",
      reportType: "CONFIRMED_YES",
      note: "吧台有單人座",
    });

    expect(mockedSubmitSoloSeatReportTransaction).toHaveBeenCalledWith({
      restaurantId: "r1",
      userId: "u1",
      reportType: "CONFIRMED_YES",
      note: "吧台有單人座",
      computeStatus: computeSoloSeatStatus,
    });
  });

  it("note 是 undefined 時轉呼叫 null，不是 undefined", async () => {
    await submitSoloSeatReport({
      restaurantId: "r1",
      userId: "u1",
      reportType: "CONFIRMED_NO",
    });

    expect(mockedSubmitSoloSeatReportTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ note: null }),
    );
  });
});

describe("getMySoloSeatReport", () => {
  beforeEach(() => {
    mockedFindSoloSeatReportByUserAndRestaurant.mockReset();
  });

  it("把 userId/restaurantId 轉呼叫 Client 層查詢函式", async () => {
    mockedFindSoloSeatReportByUserAndRestaurant.mockResolvedValue(null);

    await getMySoloSeatReport("u1", "r1");

    expect(mockedFindSoloSeatReportByUserAndRestaurant).toHaveBeenCalledWith(
      "u1",
      "r1",
    );
  });

  it("查無回報時回傳 null", async () => {
    mockedFindSoloSeatReportByUserAndRestaurant.mockResolvedValue(null);

    expect(await getMySoloSeatReport("u1", "r1")).toBeNull();
  });

  it("有回報時回傳 reportType/note", async () => {
    mockedFindSoloSeatReportByUserAndRestaurant.mockResolvedValue({
      reportType: "CONFIRMED_YES",
      note: "吧台有單人座",
    });

    expect(await getMySoloSeatReport("u1", "r1")).toEqual({
      reportType: "CONFIRMED_YES",
      note: "吧台有單人座",
    });
  });

  it("reportType 是 UNKNOWN（理論上不會發生的資料）時仍回傳 null，不當成有效回報", async () => {
    mockedFindSoloSeatReportByUserAndRestaurant.mockResolvedValue({
      reportType: "UNKNOWN",
      note: null,
    });

    expect(await getMySoloSeatReport("u1", "r1")).toBeNull();
  });
});

describe("deleteSoloSeatReport", () => {
  beforeEach(() => {
    mockedDeleteSoloSeatReportTransaction.mockReset().mockResolvedValue(
      undefined,
    );
  });

  it("把 userId/restaurantId 轉呼叫 Client 層的 transaction 函式，且帶上真正的 computeStatus 純函式", async () => {
    await deleteSoloSeatReport("u1", "r1");

    expect(mockedDeleteSoloSeatReportTransaction).toHaveBeenCalledWith({
      restaurantId: "r1",
      userId: "u1",
      computeStatus: computeSoloSeatStatus,
    });
  });
});
