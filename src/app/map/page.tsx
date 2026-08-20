"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRestaurantMapMarkers } from "@/hooks/useRestaurantMapMarkers";
import { estimateWalkingMinutes, findNearest, haversineDistanceKm } from "@/lib/geo";
import { soloSeatStatusLabel } from "@/lib/soloSeatLabel";

// Leaflet 存取 window，SSR 階段會噴錯，動態載入並關掉 ssr（比照原本首頁的做法）。
const RestaurantMap = dynamic(
  () => import("@/components/RestaurantMap").then((mod) => mod.RestaurantMap),
  { ssr: false },
);

const CITY = "台中市";
const TAICHUNG_CENTER: [number, number] = [24.1477, 120.6736];

type GeoState =
  | { status: "loading" }
  | { status: "granted"; lat: number; lng: number }
  | { status: "denied" };

export default function MapPage() {
  const [geo, setGeo] = useState<GeoState>({ status: "loading" });
  const [showFullMap, setShowFullMap] = useState(false);
  const { data: markers, isLoading } = useRestaurantMapMarkers({
    city: CITY,
    soloSeatOnly: false,
  });

  const requestLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeo({ status: "denied" });
      return;
    }

    setGeo({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setGeo({
          status: "granted",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => setGeo({ status: "denied" }),
    );
  };

  useEffect(() => {
    // requestLocation 讀取瀏覽器的 geolocation API（外部系統），完成後才 setState，
    // 不是渲染時就能算出來的值，屬於「訂閱外部系統」的合法用法。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    requestLocation();
  }, []);

  const origin =
    geo.status === "granted" ? { lat: geo.lat, lng: geo.lng } : null;
  // 目前可信的單人座位回報資料還很少，先不篩選狀態，單純找離使用者最近的一家
  // （狀態文字仍會照實顯示，不會謊稱是確定有單人座位）。
  const nearest = origin && markers ? findNearest(markers, origin) : null;
  const walkingMinutes =
    origin && nearest
      ? estimateWalkingMinutes(haversineDistanceKm(origin, nearest))
      : null;

  return (
    <main className="mx-auto flex w-full max-w-140 flex-col items-center gap-4 px-4 pb-8 pt-20 text-center">
      <p className="text-sm text-foreground/70">離你最近的一家。</p>

      {geo.status === "loading" && (
        <p className="text-sm text-foreground/60">正在取得你的位置…</p>
      )}

      {geo.status === "denied" && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-foreground/60">
            無法取得你的位置，改為顯示地圖與所有結果。
          </p>
          <button
            type="button"
            onClick={requestLocation}
            className="cursor-pointer rounded-full border border-divider px-4 py-1.5 text-sm text-foreground hover:bg-foreground/5"
          >
            允許定位
          </button>
        </div>
      )}

      {geo.status === "granted" && !isLoading && !nearest && (
        <p className="text-sm text-foreground/60">目前沒有餐廳資料。</p>
      )}

      {nearest && (
        <div className="w-full rounded-3xl border border-divider bg-surface p-4 text-left">
          <p className="font-heading text-lg text-foreground">{nearest.name}</p>
          <p className="mt-1 text-sm text-foreground/70">
            {nearest.categoryName}
            {walkingMinutes !== null && ` · 步行約 ${walkingMinutes} 分鐘`}
          </p>
          <p className="mt-1 text-sm text-foreground">
            {soloSeatStatusLabel(nearest.soloSeatStatus)}
          </p>

          <div className="mt-3 flex justify-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-divider px-4 py-1.5 text-sm text-foreground hover:bg-foreground/5"
            >
              回列表
            </Link>
            <Link
              href={`/restaurant/${nearest.id}`}
              className="rounded-full bg-accent px-4 py-1.5 text-sm text-background hover:bg-(--color-accent-600)"
            >
              查看詳情
            </Link>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowFullMap((v) => !v)}
        className="mt-2 cursor-pointer text-sm text-accent hover:underline"
      >
        {showFullMap ? "收起地圖" : "顯示完整地圖"}
      </button>

      {showFullMap && (
        <div className="w-full">
          {isLoading && <p className="text-sm text-foreground/60">地圖載入中…</p>}
          <RestaurantMap
            restaurants={markers ?? []}
            center={origin ? [origin.lat, origin.lng] : TAICHUNG_CENTER}
          />
        </div>
      )}
    </main>
  );
}
