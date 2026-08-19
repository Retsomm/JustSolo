"use client";

import Link from "next/link";
import { useRestaurantDetail } from "@/hooks/useRestaurantDetail";
import { soloSeatStatusLabel } from "@/lib/soloSeatLabel";

type RestaurantDetailViewProps = {
  id: string;
};

export const RestaurantDetailView = ({ id }: RestaurantDetailViewProps) => {
  const { data, isLoading, isError } = useRestaurantDetail(id);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 pb-6 pt-20">
      <Link href="/" className="text-sm text-foreground/70 hover:underline">
        ← 回搜尋結果
      </Link>

      {isLoading && <p className="text-sm text-foreground/70">載入中…</p>}

      {isError && (
        <p className="text-sm text-foreground/70">載入失敗，請稍後再試。</p>
      )}

      {!isLoading && !isError && !data && (
        <p className="text-sm text-foreground/70">找不到這間餐廳。</p>
      )}

      {data && (
        <article className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-bold text-foreground">{data.name}</h1>
            <span className="shrink-0 text-xs text-foreground/60">
              {data.categoryName}
            </span>
          </div>
          <p className="text-sm text-foreground">{data.address}</p>
          {data.phone && (
            <p className="text-sm text-foreground">電話：{data.phone}</p>
          )}
          <p className="text-sm text-foreground">
            {soloSeatStatusLabel(data.soloSeatStatus)}
            {data.soloSeatType ? `・${data.soloSeatType}` : ""}
          </p>
        </article>
      )}
    </main>
  );
};
