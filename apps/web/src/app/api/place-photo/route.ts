import {
  buildPlacePhotoMediaUrl,
  GOOGLE_API_TIMEOUT_MS,
  isAbortError,
  isValidPlacePhotoName,
} from "@justsolo/shared/src/server/clients/placesClient";

const DEFAULT_MAX_WIDTH_PX = 800;

// 圖片代理：前端只打這個 same-origin 路徑，Google API Key 留在伺服器端，
// 不會外洩到瀏覽器。`name` 是使用者可控的 query 參數，組 Google 網址前
// 一定要先驗證格式，避免變成任意網址代理（SSRF）的破口。
export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const name = url.searchParams.get("name");
  const maxWidthPx = Number(
    url.searchParams.get("maxWidthPx") ?? DEFAULT_MAX_WIDTH_PX,
  );

  if (!name || !isValidPlacePhotoName(name)) {
    return new Response("Invalid photo name", { status: 400 });
  }

  if (!Number.isFinite(maxWidthPx) || maxWidthPx <= 0) {
    return new Response("Invalid maxWidthPx", { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACE_NEW_API_KEY;
  if (!apiKey) {
    return new Response("Server misconfigured", { status: 500 });
  }

  const mediaUrl = buildPlacePhotoMediaUrl(name, maxWidthPx, apiKey);

  let googleResponse: Response;
  try {
    googleResponse = await fetch(mediaUrl, {
      signal: AbortSignal.timeout(GOOGLE_API_TIMEOUT_MS),
    });
  } catch (error) {
    if (isAbortError(error)) {
      return new Response("Upstream timeout", { status: 504 });
    }
    throw error;
  }

  if (!googleResponse.ok) {
    return new Response("Photo not found", { status: 502 });
  }

  return new Response(googleResponse.body, {
    headers: {
      "Content-Type": googleResponse.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
};
