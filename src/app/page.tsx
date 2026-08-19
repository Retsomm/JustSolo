"use client";

import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { useRestaurantSearch } from "@/hooks/useRestaurantSearch";
import { soloSeatStatusLabel } from "@/lib/soloSeatLabel";

const CITY = "台中市";

export default function Home() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [soloSeatOnly, setSoloSeatOnly] = useState(false);

  const { data: categories } = useCategories();
  const { data: restaurants, isLoading } = useRestaurantSearch({
    category,
    city: CITY,
    soloSeatOnly,
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">JustSolo</h1>
        <p className="text-sm text-zinc-500">
          幫你找到{CITY}真的有單人座位的餐廳
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          分類
          <select
            value={category ?? ""}
            onChange={(event) => setCategory(event.target.value || undefined)}
            className="rounded border border-zinc-300 px-2 py-1"
          >
            <option value="">全部</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={soloSeatOnly}
            onChange={(event) => setSoloSeatOnly(event.target.checked)}
          />
          僅顯示有單人座位
        </label>
      </div>

      {isLoading && <p className="text-sm text-zinc-500">搜尋中…</p>}

      <ul className="flex flex-col gap-3">
        {restaurants?.map((r) => (
          <li key={r.id} className="rounded border border-zinc-200 p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">{r.name}</h2>
              <span className="shrink-0 text-xs text-zinc-500">
                {r.categoryName}
              </span>
            </div>
            <p className="text-sm text-zinc-600">{r.address}</p>
            <p className="mt-1 text-sm">
              {soloSeatStatusLabel(r.soloSeatStatus)}
              {r.soloSeatType ? `・${r.soloSeatType}` : ""}
            </p>
          </li>
        ))}
      </ul>

      {!isLoading && restaurants?.length === 0 && (
        <p className="text-sm text-zinc-500">
          目前沒有符合條件的餐廳，換個篩選條件試試？
        </p>
      )}
    </main>
  );
}
