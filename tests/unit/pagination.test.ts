import { describe, expect, it } from "vitest";
import { buildPaginationItems } from "@/lib/pagination";

describe("buildPaginationItems", () => {
  it("只有 1 頁時只顯示 1", () => {
    expect(buildPaginationItems(1, 1)).toEqual([1]);
  });

  it("頁數不多時不需要刪節號（1~4 頁）", () => {
    expect(buildPaginationItems(3, 4)).toEqual([1, 2, 3, 4]);
  });

  it("目前頁在中間時，兩側都會出現刪節號", () => {
    expect(buildPaginationItems(5, 10)).toEqual([
      1,
      2,
      "ellipsis",
      5,
      "ellipsis",
      9,
      10,
    ]);
  });

  it("目前頁是第 1 頁時，不會跟 1/2 重複、只在後段出現刪節號", () => {
    expect(buildPaginationItems(1, 10)).toEqual([1, 2, "ellipsis", 9, 10]);
  });

  it("目前頁是最後一頁時，不會跟最後兩頁重複、只在前段出現刪節號", () => {
    expect(buildPaginationItems(10, 10)).toEqual([1, 2, "ellipsis", 9, 10]);
  });

  it("目前頁緊鄰前段時不會出現多餘的刪節號", () => {
    expect(buildPaginationItems(3, 10)).toEqual([1, 2, 3, "ellipsis", 9, 10]);
  });
});
