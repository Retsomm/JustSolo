import { describe, expect, it } from "vitest";
import { buildPlacePhotoProxyUrl } from "@/pure/placePhotoUrl";

describe("buildPlacePhotoProxyUrl", () => {
  it("組出 same-origin 的圖片代理路徑，name 做 URL encode", () => {
    expect(buildPlacePhotoProxyUrl("places/ChIJabc/photos/AVoN123", 200)).toBe(
      "/api/place-photo?name=places%2FChIJabc%2Fphotos%2FAVoN123&maxWidthPx=200",
    );
  });
});
