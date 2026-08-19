import { describe, expect, it } from "vitest";
import { soloSeatStatusLabel } from "@/lib/soloSeatLabel";

describe("soloSeatStatusLabel", () => {
  it("CONFIRMED_YES 顯示已確認有單人座位", () => {
    expect(soloSeatStatusLabel("CONFIRMED_YES")).toBe("已確認有單人座位");
  });

  it("CONFIRMED_NO 顯示已確認無單人座位", () => {
    expect(soloSeatStatusLabel("CONFIRMED_NO")).toBe("已確認無單人座位");
  });

  it("UNKNOWN 顯示尚未確認、建議致電", () => {
    expect(soloSeatStatusLabel("UNKNOWN")).toBe("尚未確認，建議致電詢問");
  });
});
