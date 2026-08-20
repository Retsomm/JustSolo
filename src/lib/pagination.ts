export type PaginationItem = number | "ellipsis";

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

// 純函式：把已排序好的清單切成單一頁，並算出分頁需要的中繼資料。
// 放在 lib（不是 server/services）是因為前端元件（例如評論分頁）也要直接用，
// Client 元件不該伸手進 server 層拿東西。
export const paginate = <T>(
  items: T[],
  page: number,
  pageSize: number,
): Paginated<T> => {
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    totalCount,
    totalPages,
  };
};

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
