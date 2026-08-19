export type PaginationItem = number | "ellipsis";

// 純函式：算出分頁按鈕要顯示哪些數字，固定格式是
// 「1、2、..、目前頁數、..、最後一頁-1、最後一頁」，重疊/相鄰的部分自動去重、不留多餘的刪節號。
export const buildPaginationItems = (
  page: number,
  totalPages: number,
): PaginationItem[] => {
  if (totalPages <= 1) return [1];

  const pageNumbers = new Set<number>([
    1,
    2,
    page,
    totalPages - 1,
    totalPages,
  ]);

  const sorted = Array.from(pageNumbers)
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  return sorted.reduce<PaginationItem[]>((items, current, index) => {
    if (index === 0) return [current];

    const previous = sorted[index - 1];
    if (current - previous > 1) items.push("ellipsis");
    items.push(current);
    return items;
  }, []);
};
