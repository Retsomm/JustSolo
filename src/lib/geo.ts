import type { RestaurantMapMarker } from "@/types/restaurant";

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;
// 一般成人平常步行速度的粗估值，換算「步行約 N 分鐘」用。
const WALKING_SPEED_KM_PER_HOUR = 5;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

// 純函式：兩個經緯度之間的球面直線距離（公里），Haversine 公式。
export const haversineDistanceKm = (a: LatLng, b: LatLng): number => {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
};

// 純函式：距離換算成粗估的步行分鐘數（無條件進位，至少 1 分鐘）。
export const estimateWalkingMinutes = (distanceKm: number): number =>
  Math.max(1, Math.ceil((distanceKm / WALKING_SPEED_KM_PER_HOUR) * 60));

// 純函式：從 marker 清單裡找出離 origin 最近的一筆，不篩選單人座位狀態
// （目前可信的單人座位回報資料還很少，篩到只剩 CONFIRMED_YES 常常直接沒結果）。
export const findNearest = (
  markers: RestaurantMapMarker[],
  origin: LatLng,
): RestaurantMapMarker | null => {
  if (markers.length === 0) return null;

  return markers.reduce((nearest, current) => {
    const nearestDistance = haversineDistanceKm(origin, nearest);
    const currentDistance = haversineDistanceKm(origin, current);
    return currentDistance < nearestDistance ? current : nearest;
  });
};
