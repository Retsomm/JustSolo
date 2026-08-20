"use client";

import { useState } from "react";
import Link from "next/link";
import { useRestaurantDetail } from "@/hooks/useRestaurantDetail";
import { soloSeatStatusLabel } from "@/lib/soloSeatLabel";
import { SoloSeatReportForm } from "@/components/SoloSeatReportForm";
import { FavoriteButton } from "@/components/FavoriteButton";
import { FriendlinessBadge } from "@/components/FriendlinessBadge";
import { PlaceDetailsSection } from "@/components/PlaceDetailsSection";
import type { PlaceDetailsTab } from "@/components/PlaceDetailsSection";

type RestaurantDetailViewProps = {
  id: string;
};

type TabKey = PlaceDetailsTab | "soloFriendly";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "總覽" },
  { key: "menu", label: "菜單" },
  { key: "reviews", label: "評論" },
  { key: "soloFriendly", label: "單人友善" },
  { key: "photos", label: "圖片" },
];

export const RestaurantDetailView = ({ id }: RestaurantDetailViewProps) => {
  const { data, isLoading, isError } = useRestaurantDetail(id);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <main className="mx-auto flex w-full max-w-140 flex-col gap-4 px-4 pb-8 pt-20">
      <Link href="/" className="text-sm text-accent hover:underline">
        ← 換一家
      </Link>

      {isLoading && <p className="text-sm text-foreground/70">載入中…</p>}

      {isError && (
        <p className="text-sm text-foreground/70">載入失敗，請稍後再試。</p>
      )}

      {!isLoading && !isError && !data && (
        <p className="text-sm text-foreground/70">找不到這間餐廳。</p>
      )}

      {data && (
        <>
          <article className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="font-heading text-2xl text-foreground">
                {data.name}
              </h1>
              <p className="mt-1 text-sm text-foreground/70">{data.categoryName}</p>
              <p className="mt-2 text-sm text-foreground">{data.address}</p>
              {data.phone && (
                <p className="text-sm text-foreground">電話：{data.phone}</p>
              )}
            </div>
            <FavoriteButton restaurantId={data.id} />
          </article>

          <div
            role="tablist"
            aria-label="餐廳詳情分類"
            className="flex overflow-hidden rounded-full border border-divider"
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={
                  activeTab === tab.key
                    ? "flex-1 bg-accent px-3 py-1.5 text-sm text-background"
                    : "flex-1 px-3 py-1.5 text-sm text-foreground hover:bg-foreground/5"
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "soloFriendly" ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 rounded-3xl border border-divider bg-surface p-4">
                <p className="text-sm text-foreground">
                  {soloSeatStatusLabel(data.soloSeatStatus)}
                  {data.soloSeatType ? `・${data.soloSeatType}` : ""}
                </p>
                <div>
                  <FriendlinessBadge
                    score={data.soloFriendlinessScore}
                    label={data.soloFriendlinessLabel}
                  />
                </div>
                {data.reportCount > 0 && (
                  <p className="text-sm text-foreground/70">{`單人座位信心：${Math.round(data.soloSeatConfidence * 100)}%（${data.reportCount} 則回報）`}</p>
                )}
              </div>
              <SoloSeatReportForm restaurantId={data.id} />
            </div>
          ) : (
            <PlaceDetailsSection restaurantId={data.id} activeTab={activeTab} />
          )}
        </>
      )}
    </main>
  );
};
