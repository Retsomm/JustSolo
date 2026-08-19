"use client";

import { buildPaginationItems } from "@/lib/pagination";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export const Pagination = ({ page, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const items = buildPaginationItems(page, totalPages);

  return (
    <nav aria-label="分頁" className="flex items-center justify-center gap-1 pt-2">
      <button
        type="button"
        aria-label="上一頁"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="cursor-pointer rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        ←
      </button>

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="px-1 text-sm text-zinc-400"
          >
            ..
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPageChange(item)}
            className={`min-w-8 cursor-pointer rounded border px-2 py-1 text-sm ${
              item === page
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        aria-label="下一頁"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="cursor-pointer rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      >
        →
      </button>
    </nav>
  );
};
