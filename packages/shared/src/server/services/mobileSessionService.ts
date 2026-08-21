import { SignJWT, jwtVerify } from "jose";
import { verifyGoogleIdToken } from "../clients/googleIdTokenClient";
import { registerOrUpdateUser } from "./authService";
import {
  createMobileSession,
  findActiveMobileSessionById,
  revokeMobileSessionById,
} from "../clients/prismaClient";
import { extractGoogleUserProfile } from "../../pure/googleIdTokenPayload";
import { parseDurationToSeconds } from "../../pure/duration";

const getSecretKey = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("缺少 AUTH_SECRET 環境變數");
  return new TextEncoder().encode(secret);
};

// 手機版沒有瀏覽器 cookie jar 可以共用網頁版 next-auth 的 JWT session cookie，
// 所以簽發一組獨立的 session token，跟網頁版共用同一把 AUTH_SECRET 但格式/用途
// 是這個專案自訂的（不是 next-auth 內部的 cookie 編碼），手機版存起來後每次 tRPC
// 請求帶 Authorization: Bearer <token>。
//
// 光靠 JWT 簽章沒辦法在到期前讓已簽出的 token 失效（登出、帳號被停用等情境），
// 所以額外在 DB 建一筆 MobileSession 紀錄，把它的 id（sessionId）當 jti 嵌進 JWT——
// 驗證時除了驗簽章，還要查這筆紀錄是否還在、沒被撤銷，撤銷單一 sessionId 即可讓
// 對應的 token 立即失效，不用等 JWT 自然過期。
export const mintMobileSessionToken = async (
  userId: string,
  expiresIn: string,
): Promise<string> => {
  const expiresAt = new Date(Date.now() + parseDurationToSeconds(expiresIn) * 1000);
  const session = await createMobileSession(userId, expiresAt);

  return new SignJWT({ userId, sessionId: session.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecretKey());
};

export type VerifiedMobileSession = { userId: string; sessionId: string };

// 驗證失敗（簽章錯誤/過期/竄改/找不到或已撤銷的 session 紀錄）一律回傳 null 而不是
// throw，讓呼叫端（tRPC context 解析）直接當作「沒有登入」處理，不用另外包 try/catch。
export const verifyMobileSessionToken = async (
  token: string,
): Promise<VerifiedMobileSession | null> => {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.userId !== "string" || typeof payload.sessionId !== "string") {
      return null;
    }

    const session = await findActiveMobileSessionById(payload.sessionId);
    if (!session || session.userId !== payload.userId) return null;

    return { userId: payload.userId, sessionId: payload.sessionId };
  } catch {
    return null;
  }
};

// 登出時撤銷這個 sessionId 對應的 MobileSession 紀錄，讓存在裝置上的 token 立即失效。
// sessionId 為 null（例如網頁版走 next-auth 的 session，不是這條手機版 token 機制）
// 時視為沒有對應紀錄可撤銷，直接 no-op。
export const revokeMobileSession = async (sessionId: string | null): Promise<void> => {
  if (!sessionId) return;
  await revokeMobileSessionById(sessionId);
};

const MOBILE_SESSION_EXPIRES_IN = "30d";

// 組合層：手機版原生 Google Sign-In SDK 拿到 id_token 後，換成這個 App 自己的
// 長效 session token。audience 沿用既有的 Web OAuth Client ID（GOOGLE_CLIENT_ID）——
// Android/iOS 原生 SDK 搭配 webClientId 設定後，簽出來的 id_token 的 aud claim
// 就是那個 Web Client ID，讓只認識 Web Client 的後端也能驗證，不用額外申請/設定
// 後端專屬的 audience 環境變數。
export const signInWithGoogleIdToken = async (
  idToken: string,
): Promise<{ token: string }> => {
  const audience = process.env.GOOGLE_CLIENT_ID;
  if (!audience) throw new Error("缺少 GOOGLE_CLIENT_ID 環境變數");

  const payload = await verifyGoogleIdToken(idToken, audience);
  const profile = extractGoogleUserProfile(payload);
  const user = await registerOrUpdateUser({
    googleId: profile.sub,
    email: profile.email,
    name: profile.name,
    image: profile.image,
  });
  const token = await mintMobileSessionToken(user.id, MOBILE_SESSION_EXPIRES_IN);

  return { token };
};
