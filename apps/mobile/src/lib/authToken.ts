// expo-secure-store 是非同步 API，trpc.ts 的 fetch 攔截器沒辦法在裡面同步等待，
// 所以用這層模組層級的記憶體鏡像：AuthProvider 開機時從 SecureStore 水合一次、
// 登入/登出時同步更新，trpc.ts 只需要同步讀這個值。
let currentToken: string | null = null;

export const getAuthToken = (): string | null => currentToken;

export const setAuthToken = (token: string | null): void => {
  currentToken = token;
};
