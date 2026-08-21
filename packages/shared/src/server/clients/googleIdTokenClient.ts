import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

const googleJwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

// Client 層：驗證手機版原生 Google Sign-In SDK 拿到的 id_token 是不是真的由 Google
// 簽發、給這個 App 用的（audience 需符合 Web OAuth Client ID，見 mobileSessionService.ts
// 的說明）。驗證失敗（簽章錯誤/過期/audience 不符）直接 throw，不吞例外。
export const verifyGoogleIdToken = async (
  idToken: string,
  audience: string,
): Promise<JWTPayload> => {
  const { payload } = await jwtVerify(idToken, googleJwks, {
    issuer: GOOGLE_ISSUERS,
    audience,
  });
  return payload;
};
