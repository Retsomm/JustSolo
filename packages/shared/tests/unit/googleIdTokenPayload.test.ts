import { describe, expect, it } from "vitest";
import { extractGoogleUserProfile } from "@/pure/googleIdTokenPayload";

describe("extractGoogleUserProfile", () => {
  it("取出 email/name/picture", () => {
    expect(
      extractGoogleUserProfile({
        email: "a@example.com",
        name: "小明",
        picture: "https://example.com/a.png",
      }),
    ).toEqual({ email: "a@example.com", name: "小明", image: "https://example.com/a.png" });
  });

  it("name/picture 缺失時回傳 null，不是 undefined", () => {
    expect(extractGoogleUserProfile({ email: "a@example.com" })).toEqual({
      email: "a@example.com",
      name: null,
      image: null,
    });
  });

  it("email 缺失時 throw", () => {
    expect(() => extractGoogleUserProfile({ name: "小明" })).toThrow();
  });

  it("email 不是字串時 throw", () => {
    expect(() => extractGoogleUserProfile({ email: 123 })).toThrow();
  });
});
