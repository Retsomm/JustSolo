import { describe, expect, it } from "vitest";
import { buildPaginationItems, paginate, resolvePageWindow } from "@/lib/pagination";

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

describe("paginate", () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it("回傳指定頁的資料與分頁中繼資料", () => {
    expect(paginate(items, 1, 10)).toEqual({
      items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      page: 1,
      pageSize: 10,
      totalCount: 25,
      totalPages: 3,
    });
  });

  it("回傳最後一頁時筆數可以少於 pageSize", () => {
    const result = paginate(items, 3, 10);

    expect(result.items).toEqual([21, 22, 23, 24, 25]);
    expect(result.totalPages).toBe(3);
  });

  it("page 超過 totalPages 時夾回最後一頁", () => {
    const result = paginate(items, 99, 10);

    expect(result.page).toBe(3);
    expect(result.items).toEqual([21, 22, 23, 24, 25]);
  });

  it("page 小於 1 時夾回第 1 頁", () => {
    const result = paginate(items, 0, 10);

    expect(result.page).toBe(1);
  });

  it("沒有資料時 totalPages 至少是 1", () => {
    const result = paginate([], 1, 10);

    expect(result).toEqual({
      items: [],
      page: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 1,
    });
  });
});

describe("resolvePageWindow", () => {
  it("回傳 skip 偏移量與分頁中繼資料", () => {
    expect(resolvePageWindow(25, 2, 10)).toEqual({
      page: 2,
      pageSize: 10,
      totalPages: 3,
      skip: 10,
    });
  });

  it("page 超過 totalPages 時夾回最後一頁", () => {
    expect(resolvePageWindow(25, 99, 10)).toEqual({
      page: 3,
      pageSize: 10,
      totalPages: 3,
      skip: 20,
    });
  });

  it("沒有資料時 totalPages 至少是 1，skip 為 0", () => {
    expect(resolvePageWindow(0, 1, 10)).toEqual({
      page: 1,
      pageSize: 10,
      totalPages: 1,
      skip: 0,
    });
  });
});
