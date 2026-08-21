// 組出前端要打的圖片代理路徑（same-origin，不含 Google API Key）。
// 跟 placesClient.ts 的 buildPlacePhotoMediaUrl（伺服器端組 Google 網址、含 API Key）
// 是不同層、不同用途，命名刻意不同避免搞混。
export const buildPlacePhotoProxyUrl = (
  photoName: string,
  maxWidthPx: number,
): string =>
  `/api/place-photo?name=${encodeURIComponent(photoName)}&maxWidthPx=${maxWidthPx}`;
