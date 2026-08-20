"use client";

import { useState } from "react";
import { useRestaurantPlaceDetails } from "@/hooks/useRestaurantPlaceDetails";
import { priceLevelLabel } from "@/lib/priceLevel";
import { buildPlacePhotoProxyUrl } from "@/lib/placePhotoUrl";
import { PhotoLightbox } from "@/components/PhotoLightbox";

const THUMBNAIL_WIDTH_PX = 200;

export type PlaceDetailsTab = "overview" | "menu" | "reviews" | "photos";

type PlaceDetailsSectionProps = {
  restaurantId: string;
  activeTab: PlaceDetailsTab;
};

export const PlaceDetailsSection = ({
  restaurantId,
  activeTab,
}: PlaceDetailsSectionProps) => {
  const { data, isLoading, isError } = useRestaurantPlaceDetails(restaurantId);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (isLoading) {
    return <p className="text-sm text-foreground/60">載入更多資訊中…</p>;
  }

  // 沒有 placeId、Google 查不到、或 Google API 呼叫失敗時，安靜地顯示一個中性提示，
  // 不當成錯誤嚇到使用者。
  if (isError || !data) {
    return <p className="text-sm text-foreground/60">目前沒有更多資訊可顯示。</p>;
  }

  if (activeTab === "overview") {
    const price = priceLevelLabel(data.priceLevel);
    const hasOverviewContent =
      data.rating !== null || price || data.editorialSummary || data.openingHours;

    if (!hasOverviewContent) {
      return <p className="text-sm text-foreground/60">目前沒有更多資訊可顯示。</p>;
    }

    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
          {data.rating !== null && (
            <span>
              ⭐ {data.rating}
              {data.userRatingCount !== null &&
                `（Google 上共 ${data.userRatingCount} 人評分）`}
            </span>
          )}
          {price && <span className="text-foreground/70">· {price}</span>}
        </div>

        {data.editorialSummary && (
          <p className="text-sm text-foreground/70">{data.editorialSummary}</p>
        )}

        {data.openingHours && (
          <div className="text-sm text-foreground/70">
            <p className="text-foreground">營業時間</p>
            <ul>
              {data.openingHours.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "menu") {
    return (
      <div className="flex flex-col gap-3 text-sm">
        {data.websiteUri && (
          <a
            href={data.websiteUri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline hover:no-underline"
          >
            前往官網
          </a>
        )}
        <a
          href={data.googleMapsUri}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline hover:no-underline"
        >
          在 Google Maps 上查看菜單與更多資訊
        </a>
      </div>
    );
  }

  if (activeTab === "reviews") {
    if (data.reviews.length === 0) {
      return <p className="text-sm text-foreground/60">目前沒有評論。</p>;
    }

    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs text-foreground/60">
          Google 只提供最多 5 則精選評論
          {data.userRatingCount !== null &&
            `（Google 上共 ${data.userRatingCount} 人評分）`}
          ，
          <a
            href={data.googleMapsUri}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            完整評論請至 Google Maps 查看
          </a>
          。
        </p>

        {data.reviews.map((review, i) => (
          <div
            key={`${review.authorName}-${i}`}
            className="flex flex-col gap-1 border-t border-foreground/10 pt-2 text-sm first:border-t-0 first:pt-0"
          >
            <div className="flex items-center gap-2 text-foreground/70">
              <span className="text-foreground">{review.authorName}</span>
              <span>{"⭐".repeat(review.rating)}</span>
              {review.relativeTime && <span>· {review.relativeTime}</span>}
            </div>
            {review.text && (
              <p className="whitespace-pre-line text-foreground/70">
                {review.text}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // activeTab === "photos"
  if (data.photos.length === 0) {
    return <p className="text-sm text-foreground/60">目前沒有照片。</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {data.photos.map((photo, i) => (
        <button
          key={photo.name}
          type="button"
          onClick={() => setOpenIndex(i)}
          className="aspect-square cursor-pointer overflow-hidden rounded"
          aria-label={`放大檢視第 ${i + 1} 張照片`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={buildPlacePhotoProxyUrl(photo.name, THUMBNAIL_WIDTH_PX)}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </button>
      ))}

      {openIndex !== null && (
        <PhotoLightbox
          photos={data.photos}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </div>
  );
};
