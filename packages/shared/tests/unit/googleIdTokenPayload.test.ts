import { describe, expect, it } from "vitest";
import { extractGoogleUserProfile } from "@/pure/googleIdTokenPayload";

describe("extractGoogleUserProfile", () => {
  it("取出 sub/email/name/picture", () => {
    expect(
      extractGoogleUserProfile({
        sub: "google-sub-1",
        email: "a@example.com",
        email_verified: true,
        name: "小明",
        picture: "https://example.com/a.png",
      }),
    ).toEqual({
      sub: "google-sub-1",
      email: "a@example.com",
      name: "小明",
      image: "https://example.com/a.png",
    });
  });

  it("name/picture 缺失時回傳 null，不是 undefined", () => {
    expect(
      extractGoogleUserProfile({ sub: "google-sub-1", email: "a@example.com", email_verified: true }),
    ).toEqual({
      sub: "google-sub-1",
      email: "a@example.com",
      name: null,
      image: null,
    });
  });

  it("sub 缺失時 throw", () => {
    expect(() =>
      extractGoogleUserProfile({ email: "a@example.com", email_verified: true }),
    ).toThrow();
  });

  it("email 缺失時 throw", () => {
    expect(() =>
      extractGoogleUserProfile({ sub: "google-sub-1", email_verified: true }),
    ).toThrow();
  });

  it("email 不是字串時 throw", () => {
    expect(() =>
      extractGoogleUserProfile({ sub: "google-sub-1", email: 123, email_verified: true }),
    ).toThrow();
  });

  it("email_verified 不是 true 時 throw（未驗證的 email 不可信）", () => {
    expect(() =>
      extractGoogleUserProfile({ sub: "google-sub-1", email: "a@example.com", email_verified: false }),
    ).toThrow();
    expect(() =>
      extractGoogleUserProfile({ sub: "google-sub-1", email: "a@example.com" }),
    ).toThrow();
  });
});
