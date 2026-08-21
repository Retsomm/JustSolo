export type PaginationItem = number | "ellipsis";

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type PageWindow = {
  page: number;
  pageSize: number;
  totalPages: number;
  skip: number;
};

// 純函式：只算「這一頁的中繼資料」（頁碼夾在合法範圍內、對應的 skip 偏移量），
// 不碰資料本身——in-memory 切頁（paginate）跟 DB 層 skip/take 分頁（例如
// listFavoriteRestaurantsByUserId）共用同一套「page 超出範圍時怎麼夾」的算法，
// 避免兩處各自實作出不一致的行為。
export const resolvePageWindow = (
  totalCount: number,
  page: number,
  pageSize: number,
): PageWindow => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  return {
    page: safePage,
    pageSize,
    totalPages,
    skip: (safePage - 1) * pageSize,
  };
};

// 純函式：把已排序好的清單切成單一頁，並算出分頁需要的中繼資料。
// 放在 lib（不是 server/services）是因為前端元件（例如評論分頁）也要直接用，
// Client 元件不該伸手進 server 層拿東西。
export const paginate = <T>(
  items: T[],
  page: number,
  pageSize: number,
): Paginated<T> => {
  const { page: safePage, totalPages, skip } = resolvePageWindow(
    items.length,
    page,
    pageSize,
  );

  return {
    items: items.slice(skip, skip + pageSize),
    page: safePage,
    pageSize,
    totalCount: items.length,
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
