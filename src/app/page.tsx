"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCategories } from "@/hooks/useCategories";
import { useDistricts } from "@/hooks/useDistricts";
import { useRestaurantSearch } from "@/hooks/useRestaurantSearch";
import { useRestaurantMapMarkers } from "@/hooks/useRestaurantMapMarkers";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { soloSeatStatusLabel } from "@/lib/soloSeatLabel";
import { Pagination } from "@/components/Pagination";

// Leaflet 存取 window，SSR 階段會噴錯，動態載入並關掉 ssr。
const RestaurantMap = dynamic(
  () => import("@/components/RestaurantMap").then((mod) => mod.RestaurantMap),
  { ssr: false },
);

const CITY = "台中市";
const SEARCH_DEBOUNCE_MS = 300;

type View = "list" | "map";

export default function Home() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [district, setDistrict] = useState<string | undefined>(undefined);
  const [keywordInput, setKeywordInput] = useState("");
  const [soloSeatOnly, setSoloSeatOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<View>("list");

  const debouncedKeyword = useDebouncedValue(keywordInput, SEARCH_DEBOUNCE_MS);

  const { data: categories } = useCategories();
  const { data: districts } = useDistricts();
  const { data, isLoading } = useRestaurantSearch({
    category,
    district,
    keyword: debouncedKeyword || undefined,
    city: CITY,
    soloSeatOnly,
    page,
  });
  const { data: mapMarkers, isLoading: isMapLoading } = useRestaurantMapMarkers(
    {
      category,
      district,
      keyword: debouncedKeyword || undefined,
      city: CITY,
      soloSeatOnly,
    },
    { enabled: view === "map" },
  );

  const restaurants = data?.items ?? [];

  const handleCategoryChange = (value: string) => {
    setCategory(value || undefined);
    setPage(1);
  };

  const handleDistrictChange = (value: string) => {
    setDistrict(value || undefined);
    setPage(1);
  };

  const handleKeywordChange = (value: string) => {
    setKeywordInput(value);
    setPage(1);
  };

  const handleSoloSeatOnlyChange = (checked: boolean) => {
    setSoloSeatOnly(checked);
    setPage(1);
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 pb-6 pt-20">
      <p className="text-sm text-foreground/60">
        幫你找到{CITY}真的有單人座位的餐廳
      </p>

      <input
        type="text"
        value={keywordInput}
        onChange={(event) => handleKeywordChange(event.target.value)}
        placeholder="搜尋店名"
        aria-label="搜尋店名"
        className="rounded border border-foreground/15 bg-background px-3 py-2 text-sm text-foreground"
      />

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          分類
          <select
            value={category ?? ""}
            onChange={(event) => handleCategoryChange(event.target.value)}
            className="rounded border border-foreground/15 bg-background px-2 py-1 text-foreground"
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
          行政區
          <select
            value={district ?? ""}
            onChange={(event) => handleDistrictChange(event.target.value)}
            className="rounded border border-foreground/15 bg-background px-2 py-1 text-foreground"
          >
            <option value="">全部</option>
            {districts?.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={soloSeatOnly}
            onChange={(event) => handleSoloSeatOnlyChange(event.target.checked)}
          />
          僅顯示有單人座位
        </label>
      </div>

      <div className="flex gap-2" role="group" aria-label="切換檢視模式">
        <button
          type="button"
          onClick={() => setView("list")}
          aria-pressed={view === "list"}
          className={
            view === "list"
              ? "rounded bg-foreground px-3 py-1 text-sm text-background"
              : "rounded border border-foreground/15 px-3 py-1 text-sm text-foreground hover:bg-foreground/5"
          }
        >
          列表
        </button>
        <button
          type="button"
          onClick={() => setView("map")}
          aria-pressed={view === "map"}
          className={
            view === "map"
              ? "rounded bg-foreground px-3 py-1 text-sm text-background"
              : "rounded border border-foreground/15 px-3 py-1 text-sm text-foreground hover:bg-foreground/5"
          }
        >
          地圖
        </button>
      </div>

      {view === "list" && (
        <>
          {isLoading && <p className="text-sm text-foreground/60">搜尋中…</p>}

          <ul className="flex flex-col gap-3">
            {restaurants.map((r) => (
              <li
                className="rounded border border-foreground/10 hover:bg-foreground/5"
                key={r.id}
              >
                <Link href={`/restaurant/${r.id}`} className="block p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold text-foreground">{r.name}</h2>
                    <span className="shrink-0 text-xs text-foreground/50">
                      {r.categoryName}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/60">{r.address}</p>
                  <p className="mt-1 text-sm text-foreground/70">
                    {soloSeatStatusLabel(r.soloSeatStatus)}
                    {r.soloSeatType ? `・${r.soloSeatType}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          {!isLoading && restaurants.length === 0 && (
            <p className="text-sm text-foreground/60">
              目前沒有符合條件的餐廳，換個篩選條件試試？
            </p>
          )}

          {data && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {view === "map" && (
        <>
          {isMapLoading && <p className="text-sm text-foreground/60">地圖載入中…</p>}
          <RestaurantMap restaurants={mapMarkers ?? []} />
        </>
      )}
    </main>
  );
}
