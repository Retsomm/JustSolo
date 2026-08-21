import { describe, expect, it, vi, beforeEach } from "vitest";
import { verifyGoogleIdToken } from "@/server/clients/googleIdTokenClient";
import { registerOrUpdateUser } from "@/server/services/authService";
import {
  createMobileSession,
  findActiveMobileSessionById,
  revokeMobileSessionById,
} from "@/server/clients/prismaClient";
import {
  mintMobileSessionToken,
  verifyMobileSessionToken,
  revokeMobileSession,
  signInWithGoogleIdToken,
} from "@/server/services/mobileSessionService";

vi.mock("@/server/clients/googleIdTokenClient", () => ({
  verifyGoogleIdToken: vi.fn(),
}));

vi.mock("@/server/services/authService", () => ({
  registerOrUpdateUser: vi.fn(),
}));

vi.mock("@/server/clients/prismaClient", () => ({
  createMobileSession: vi.fn(),
  findActiveMobileSessionById: vi.fn(),
  revokeMobileSessionById: vi.fn(),
}));

const mockedVerifyGoogleIdToken = vi.mocked(verifyGoogleIdToken);
const mockedRegisterOrUpdateUser = vi.mocked(registerOrUpdateUser);
const mockedCreateMobileSession = vi.mocked(createMobileSession);
const mockedFindActiveMobileSessionById = vi.mocked(findActiveMobileSessionById);
const mockedRevokeMobileSessionById = vi.mocked(revokeMobileSessionById);

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "test-secret-at-least-32-bytes-long-ok");
  vi.stubEnv("GOOGLE_CLIENT_ID", "web-client-id.apps.googleusercontent.com");
  mockedVerifyGoogleIdToken.mockReset();
  mockedRegisterOrUpdateUser.mockReset();
  mockedCreateMobileSession.mockReset();
  mockedFindActiveMobileSessionById.mockReset();
  mockedRevokeMobileSessionById.mockReset();
});

describe("mintMobileSessionToken / verifyMobileSessionToken", () => {
  it("簽出來的 token 能被解回同一個 userId/sessionId", async () => {
    mockedCreateMobileSession.mockResolvedValue({ id: "session-1" });
    mockedFindActiveMobileSessionById.mockResolvedValue({ userId: "u1" });

    const token = await mintMobileSessionToken("u1", "30d");

    expect(mockedCreateMobileSession).toHaveBeenCalledWith("u1", expect.any(Date));
    await expect(verifyMobileSessionToken(token)).resolves.toEqual({
      userId: "u1",
      sessionId: "session-1",
    });
  });

  it("竄改過的 token 回傳 null", async () => {
    mockedCreateMobileSession.mockResolvedValue({ id: "session-1" });
    const token = await mintMobileSessionToken("u1", "30d");
    await expect(verifyMobileSessionToken(`${token}tampered`)).resolves.toBeNull();
  });

  it("已過期的 token 回傳 null", async () => {
    mockedCreateMobileSession.mockResolvedValue({ id: "session-1" });
    const token = await mintMobileSessionToken("u1", "-1s");
    await expect(verifyMobileSessionToken(token)).resolves.toBeNull();
  });

  it("sessionId 對應的紀錄不存在或已撤銷時回傳 null", async () => {
    mockedCreateMobileSession.mockResolvedValue({ id: "session-1" });
    mockedFindActiveMobileSessionById.mockResolvedValue(null);

    const token = await mintMobileSessionToken("u1", "30d");
    await expect(verifyMobileSessionToken(token)).resolves.toBeNull();
  });
});

describe("revokeMobileSession", () => {
  it("sessionId 存在時撤銷對應紀錄", async () => {
    await revokeMobileSession("session-1");
    expect(mockedRevokeMobileSessionById).toHaveBeenCalledWith("session-1");
  });

  it("sessionId 為 null 時 no-op（網頁版 next-auth session 沒有對應紀錄）", async () => {
    await revokeMobileSession(null);
    expect(mockedRevokeMobileSessionById).not.toHaveBeenCalled();
  });
});

describe("signInWithGoogleIdToken", () => {
  // 比照 restaurantSearchService/soloSeatReportService 已踩過的坑：組合層轉呼叫
  // 下一層時容易漏傳欄位，這裡直接斷言每個依賴都真的被呼叫到、且參數完整轉呼叫。
  it("依序驗證 id_token、以 googleId 轉呼叫 registerOrUpdateUser、簽出 token", async () => {
    mockedVerifyGoogleIdToken.mockResolvedValue({
      sub: "google-sub-1",
      email: "a@example.com",
      email_verified: true,
      name: "小明",
      picture: "https://example.com/a.png",
    });
    mockedRegisterOrUpdateUser.mockResolvedValue({ id: "u1" });
    mockedCreateMobileSession.mockResolvedValue({ id: "session-1" });
    mockedFindActiveMobileSessionById.mockResolvedValue({ userId: "u1" });

    const result = await signInWithGoogleIdToken("raw-id-token");

    expect(mockedVerifyGoogleIdToken).toHaveBeenCalledWith(
      "raw-id-token",
      "web-client-id.apps.googleusercontent.com",
    );
    expect(mockedRegisterOrUpdateUser).toHaveBeenCalledWith({
      googleId: "google-sub-1",
      email: "a@example.com",
      name: "小明",
      image: "https://example.com/a.png",
    });
    await expect(verifyMobileSessionToken(result.token)).resolves.toEqual({
      userId: "u1",
      sessionId: "session-1",
    });
  });
});
