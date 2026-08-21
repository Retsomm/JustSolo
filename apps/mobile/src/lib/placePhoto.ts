import { buildPlacePhotoProxyUrl } from "@justsolo/shared";
import { resolveApiBaseUrl } from "./apiBaseUrl";

// buildPlacePhotoProxyUrl（packages/shared 的純函式）回傳相對路徑
// `/api/place-photo?...`，網頁版靠 same-origin 相對路徑就能用，
// 手機版沒有「同源」這件事，要自己補上後端的 origin。
export const buildAbsolutePlacePhotoUrl = (name: string, maxWidthPx: number): string =>
  `${resolveApiBaseUrl()}${buildPlacePhotoProxyUrl(name, maxWidthPx)}`;
