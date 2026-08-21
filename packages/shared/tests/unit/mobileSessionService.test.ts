import { describe, expect, it, vi, beforeEach } from "vitest";
import { verifyGoogleIdToken } from "@/server/clients/googleIdTokenClient";
import { registerOrUpdateUser } from "@/server/services/authService";
import {
  mintMobileSessionToken,
  verifyMobileSessionToken,
  signInWithGoogleIdToken,
} from "@/server/services/mobileSessionService";

vi.mock("@/server/clients/googleIdTokenClient", () => ({
  verifyGoogleIdToken: vi.fn(),
}));

vi.mock("@/server/services/authService", () => ({
  registerOrUpdateUser: vi.fn(),
}));

const mockedVerifyGoogleIdToken = vi.mocked(verifyGoogleIdToken);
const mockedRegisterOrUpdateUser = vi.mocked(registerOrUpdateUser);

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "test-secret-at-least-32-bytes-long-ok");
  vi.stubEnv("GOOGLE_CLIENT_ID", "web-client-id.apps.googleusercontent.com");
  mockedVerifyGoogleIdToken.mockReset();
  mockedRegisterOrUpdateUser.mockReset();
});

describe("mintMobileSessionToken / verifyMobileSessionToken", () => {
  it("簽出來的 token 能被解回同一個 userId", async () => {
    const token = await mintMobileSessionToken("u1", "30d");
    await expect(verifyMobileSessionToken(token)).resolves.toBe("u1");
  });

  it("竄改過的 token 回傳 null", async () => {
    const token = await mintMobileSessionToken("u1", "30d");
    await expect(verifyMobileSessionToken(`${token}tampered`)).resolves.toBeNull();
  });

  it("已過期的 token 回傳 null", async () => {
    const token = await mintMobileSessionToken("u1", "-1s");
    await expect(verifyMobileSessionToken(token)).resolves.toBeNull();
  });
});

describe("signInWithGoogleIdToken", () => {
  // 比照 restaurantSearchService/soloSeatReportService 已踩過的坑：組合層轉呼叫
  // 下一層時容易漏傳欄位，這裡直接斷言每個依賴都真的被呼叫到、且參數完整轉呼叫。
  it("依序驗證 id_token、轉呼叫 registerOrUpdateUser、簽出 token", async () => {
    mockedVerifyGoogleIdToken.mockResolvedValue({
      email: "a@example.com",
      name: "小明",
      picture: "https://example.com/a.png",
    });
    mockedRegisterOrUpdateUser.mockResolvedValue({ id: "u1" });

    const result = await signInWithGoogleIdToken("raw-id-token");

    expect(mockedVerifyGoogleIdToken).toHaveBeenCalledWith(
      "raw-id-token",
      "web-client-id.apps.googleusercontent.com",
    );
    expect(mockedRegisterOrUpdateUser).toHaveBeenCalledWith({
      email: "a@example.com",
      name: "小明",
      image: "https://example.com/a.png",
    });
    await expect(verifyMobileSessionToken(result.token)).resolves.toBe("u1");
  });
});
