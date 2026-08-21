import { SignJWT, jwtVerify } from "jose";
import { verifyGoogleIdToken } from "../clients/googleIdTokenClient";
import { registerOrUpdateUser } from "./authService";
import { extractGoogleUserProfile } from "../../pure/googleIdTokenPayload";

const getSecretKey = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("缺少 AUTH_SECRET 環境變數");
  return new TextEncoder().encode(secret);
};

// 手機版沒有瀏覽器 cookie jar 可以共用網頁版 next-auth 的 JWT session cookie，
// 所以簽發一組獨立的 session token，跟網頁版共用同一把 AUTH_SECRET 但格式/用途
// 是這個專案自訂的（不是 next-auth 內部的 cookie 編碼），手機版存起來後每次 tRPC
// 請求帶 Authorization: Bearer <token>。
export const mintMobileSessionToken = (userId: string, expiresIn: string): Promise<string> =>
  new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecretKey());

// 驗證失敗（簽章錯誤/過期/竄改）回傳 null 而不是 throw，讓呼叫端（tRPC context 解析）
// 直接當作「沒有登入」處理，不用另外包 try/catch。
export const verifyMobileSessionToken = async (token: string): Promise<string | null> => {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
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
  const user = await registerOrUpdateUser(profile);
  const token = await mintMobileSessionToken(user.id, MOBILE_SESSION_EXPIRES_IN);

  return { token };
};
