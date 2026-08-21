import type { JWTPayload } from "jose";

export type GoogleUserProfile = {
  email: string;
  name: string | null;
  image: string | null;
};

// 純函式：從已驗證過簽章/發行者/audience 的 Google id_token payload 取出帳號系統
// 需要的欄位。email 是 registerOrUpdateUser（authService）upsert User 的必要欄位，
// 缺失就視為不合法的 payload 直接 throw。
export const extractGoogleUserProfile = (payload: JWTPayload): GoogleUserProfile => {
  const email = payload.email;
  if (typeof email !== "string" || email.length === 0) {
    throw new Error("Google id_token payload 缺少 email");
  }

  const name = typeof payload.name === "string" ? payload.name : null;
  const image = typeof payload.picture === "string" ? payload.picture : null;

  return { email, name, image };
};
