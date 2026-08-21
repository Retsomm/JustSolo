"use client";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import L from "leaflet";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { soloSeatStatusLabel } from "@justsolo/shared";
import type { RestaurantMapMarker, SoloSeatStatus } from "@justsolo/shared";

const TAICHUNG_CENTER: [number, number] = [24.1477, 120.6736];
const DEFAULT_ZOOM = 12;

const markerColorByStatus: Record<SoloSeatStatus, string> = {
  CONFIRMED_YES: "#2f9e44",
  UNKNOWN: "#868e96",
  CONFIRMED_NO: "#e8590c",
};

// 不用 Leaflet 預設的 PNG icon（Next.js 打包常見的路徑 404 問題），改用內嵌 SVG 的
// divIcon 畫實心圓點，順便依單人座位狀態上色。
const buildStatusIcon = (status: SoloSeatStatus) =>
  L.divIcon({
    className: "",
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${markerColorByStatus[status]};border:2px solid white;box-shadow:0 0 2px rgba(0,0,0,0.4);"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

type RestaurantMapProps = {
  restaurants: RestaurantMapMarker[];
  center?: [number, number];
};

export const RestaurantMap = ({ restaurants, center }: RestaurantMapProps) => {
  return (
    <div className="h-[70vh] w-full overflow-hidden rounded-3xl border border-divider">
      <MapContainer
        center={center ?? TAICHUNG_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerClusterGroup chunkedLoading>
          {restaurants.map((r) => (
            <Marker
              key={r.id}
              position={[r.lat, r.lng]}
              icon={buildStatusIcon(r.soloSeatStatus)}
            >
              <Popup>
                {/* Leaflet popup 的背景固定是白色（來自 leaflet.css，不隨 App 的
                    dark/light 主題翻轉），這裡刻意用固定深色文字，不要用會翻轉的
                    text-foreground，否則深色模式下會變成白字疊白底看不見。 */}
                <div className="flex flex-col gap-1 text-gray-900">
                  <span className="font-semibold">{r.name}</span>
                  <span className="text-sm text-gray-600">
                    {soloSeatStatusLabel(r.soloSeatStatus)}
                  </span>
                  <Link
                    href={`/restaurant/${r.id}`}
                    className="text-sm text-blue-600 underline"
                  >
                    查看詳情
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default RestaurantMap;
