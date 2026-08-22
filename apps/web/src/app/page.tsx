"use client";

import { useState } from "react";
import Link from "next/link";
import { useCategories } from "@/hooks/useCategories";
import { useDistricts } from "@/hooks/useDistricts";
import { useRestaurantPick } from "@/hooks/useRestaurantPick";
import { useRestaurantSearch } from "@/hooks/useRestaurantSearch";
import { useRestaurantPlaceDetails } from "@/hooks/useRestaurantPlaceDetails";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { buildPlacePhotoProxyUrl } from "@justsolo/shared";
import { Pagination } from "@/components/Pagination";
import { FriendlinessBadge } from "@/components/FriendlinessBadge";
import { FavoriteButton } from "@/components/FavoriteButton";

const CITY = "台中市";
const SEARCH_DEBOUNCE_MS = 300;
const HERO_PHOTO_WIDTH_PX = 640;

const FilterIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 3H2l8 9.46V19l4 2v-8.54z" />
  </svg>
);

const ShuffleIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 12a9 9 0 1 0 2.83-6.36L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

export default function Home() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [district, setDistrict] = useState<string | undefined>(undefined);
  const [keywordInput, setKeywordInput] = useState("");
  const [soloSeatOnly, setSoloSeatOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const debouncedKeyword = useDebouncedValue(keywordInput, SEARCH_DEBOUNCE_MS);

  const { data: categories } = useCategories();
  const { data: districts } = useDistricts();

  const filterInput = {
    category,
    district,
    keyword: debouncedKeyword || undefined,
    city: CITY,
    soloSeatOnly,
  };

  const { data: pick, isLoading: isPickLoading } = useRestaurantPick({
    ...filterInput,
    excludeIds: excludedIds,
  });
  const current = pick?.restaurant ?? null;

  const { data: placeDetails } = useRestaurantPlaceDetails(current?.id ?? "", {
    enabled: !!current,
  });
  const heroPhoto = placeDetails?.photos[0];

  const { data: list, isLoading: isListLoading } = useRestaurantSearch(
    { ...filterInput, page },
    { enabled: listOpen },
  );

  const resetPick = () => {
    setExcludedIds([]);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value || undefined);
    resetPick();
  };

  const handleDistrictChange = (value: string) => {
    setDistrict(value || undefined);
    resetPick();
  };

  const handleKeywordChange = (value: string) => {
    setKeywordInput(value);
    resetPick();
  };

  const handleSoloSeatOnlyChange = (checked: boolean) => {
    setSoloSeatOnly(checked);
    resetPick();
  };

  const handleShuffle = () => {
    if (current) setExcludedIds((prev) => [...prev, current.id]);
  };

  return (
    <main className="mx-auto flex w-full max-w-140 flex-col items-center gap-4 px-4 pb-8 pt-20 text-center">
      <p className="text-sm text-foreground/70">
        今天，想一個人去哪裡吃？一次只推薦一家，慢慢挑。
      </p>

      <button
        type="button"
        onClick={() => setFilterOpen((v) => !v)}
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-accent hover:underline"
      >
        <FilterIcon />
        篩選條件
      </button>

      {filterOpen && (
        <div className="flex w-full flex-col gap-3 rounded-3xl border border-divider bg-surface p-4 text-left">
          <label className="flex flex-col gap-1 text-sm">
            搜尋店名
            <input
              type="text"
              value={keywordInput}
              onChange={(event) => handleKeywordChange(event.target.value)}
              placeholder="例如：砂鍋粥"
              aria-label="搜尋店名"
              className="rounded-full border border-divider bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              分類
              <select
                value={category ?? ""}
                onChange={(event) => handleCategoryChange(event.target.value)}
                className="rounded-full border border-divider bg-background px-3 py-2 text-foreground"
              >
                <option value="">全部</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-1 flex-col gap-1 text-sm">
              行政區
              <select
                value={district ?? ""}
                onChange={(event) => handleDistrictChange(event.target.value)}
                className="rounded-full border border-divider bg-background px-3 py-2 text-foreground"
              >
                <option value="">全部</option>
                {districts?.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={soloSeatOnly}
              onChange={(event) => handleSoloSeatOnlyChange(event.target.checked)}
              className="accent-accent"
            />
            僅顯示有單人座位
          </label>
        </div>
      )}

      {isPickLoading && <p className="text-sm text-foreground/60">搜尋中…</p>}

      {!isPickLoading && current && (
        <>
          <div className="w-full overflow-hidden rounded-3xl border border-divider bg-surface text-left">
            <div className="h-52 w-full bg-foreground/10">
              {heroPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={buildPlacePhotoProxyUrl(heroPhoto.name, HERO_PHOTO_WIDTH_PX)}
                  alt={`${current.name} 照片`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-foreground/40">
                  尚無照片
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="min-w-0 flex-1 font-heading text-xl text-foreground">
                  {current.name}
                </h2>
                <FriendlinessBadge
                  score={current.soloFriendlinessScore}
                  label={current.soloFriendlinessLabel}
                />
              </div>
              <p className="mt-1 text-sm text-foreground/70">
                {current.categoryName} · {current.address}
              </p>
              <div className="mt-2 flex justify-end">
                <FavoriteButton restaurantId={current.id} />
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={handleShuffle}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-divider px-4 py-1.5 text-sm text-foreground hover:bg-foreground/5"
            >
              <ShuffleIcon />
              換一家
            </button>
            <Link
              href={`/restaurant/${current.id}`}
              className="rounded-full bg-accent px-4 py-1.5 text-sm text-background hover:bg-(--color-accent-600)"
            >
              前往看看
            </Link>
          </div>
        </>
      )}

      {!isPickLoading && !current && (
        <p className="text-sm text-foreground/60">
          目前沒有符合條件的餐廳，換個篩選條件試試？
        </p>
      )}

      <button
        type="button"
        onClick={() => setListOpen((v) => !v)}
        className="mt-4 cursor-pointer text-sm text-accent hover:underline"
      >
        {listOpen ? "收起完整列表" : `或查看完整列表（${pick?.totalCount ?? 0} 家）`}
      </button>

      {listOpen && (
        <div className="flex w-full flex-col gap-3 text-left">
          {isListLoading && <p className="text-sm text-foreground/60">載入中…</p>}

          <ul className="flex flex-col gap-3">
            {list?.items.map((r) => (
              <li
                key={r.id}
                className="rounded-3xl border border-divider bg-surface hover:bg-foreground/5"
              >
                <div className="p-4">
                  <Link href={`/restaurant/${r.id}`} className="block">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="min-w-0 flex-1 font-semibold text-foreground">
                        {r.name}
                      </h3>
                      <span className="shrink-0 text-xs text-foreground/50">
                        {r.categoryName}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/60">{r.address}</p>
                    {r.soloSeatType && (
                      <p className="mt-1 text-sm text-foreground/70">{r.soloSeatType}</p>
                    )}
                  </Link>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <FriendlinessBadge
                      score={r.soloFriendlinessScore}
                      label={r.soloFriendlinessLabel}
                    />
                    <FavoriteButton restaurantId={r.id} />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {!isListLoading && list?.items.length === 0 && (
            <p className="text-sm text-foreground/60">
              目前沒有符合條件的餐廳，換個篩選條件試試？
            </p>
          )}

          {list && (
            <Pagination
              page={list.page}
              totalPages={list.totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      )}
    </main>
  );
}
