import { describe, expect, it } from "vitest";
import { priceLevelLabel } from "@/lib/priceLevel";

describe("priceLevelLabel", () => {
  it("把 Google 的 priceLevel enum 轉成 $ 符號", () => {
    expect(priceLevelLabel("PRICE_LEVEL_INEXPENSIVE")).toBe("$");
    expect(priceLevelLabel("PRICE_LEVEL_MODERATE")).toBe("$$");
    expect(priceLevelLabel("PRICE_LEVEL_EXPENSIVE")).toBe("$$$");
    expect(priceLevelLabel("PRICE_LEVEL_VERY_EXPENSIVE")).toBe("$$$$");
  });

  it("null 或不認得的字串回傳 null", () => {
    expect(priceLevelLabel(null)).toBeNull();
    expect(priceLevelLabel("SOMETHING_UNKNOWN")).toBeNull();
  });
});
