import type { JWTPayload } from "jose";

export type GoogleUserProfile = {
  sub: string;
  email: string;
  name: string | null;
  image: string | null;
};

// 純函式：從已驗證過簽章/發行者/audience 的 Google id_token payload 取出帳號系統
// 需要的欄位。sub 是帳號系統的實際身分鍵（見 prismaClient.ts 的 upsertUserByGoogleId），
// email 只作為顯示/聯絡用途——email 本身可能被使用者在 Google 端更改，不是穩定識別碼，
// 且沒檢查 email_verified 就拿來比對帳號會有被冒用未驗證信箱的風險，所以連同 sub 一起
// 缺失或未驗證都視為不合法的 payload 直接 throw。
export const extractGoogleUserProfile = (payload: JWTPayload): GoogleUserProfile => {
  const sub = payload.sub;
  if (typeof sub !== "string" || sub.length === 0) {
    throw new Error("Google id_token payload 缺少 sub");
  }

  const email = payload.email;
  if (typeof email !== "string" || email.length === 0) {
    throw new Error("Google id_token payload 缺少 email");
  }

  if (payload.email_verified !== true) {
    throw new Error("Google id_token payload 的 email 尚未驗證");
  }

  const name = typeof payload.name === "string" ? payload.name : null;
  const image = typeof payload.picture === "string" ? payload.picture : null;

  return { sub, email, name, image };
};
