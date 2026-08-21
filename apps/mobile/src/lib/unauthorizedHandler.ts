// trpc.ts 的 fetch 攔截器在還沒有 React tree 可用的模組層級執行，沒辦法直接呼叫
// useAuth() 拿 handleUnauthorized；AuthProvider 掛載後把它註冊進來，trpc.ts 偵測到
// 「這次 401 反映的就是目前使用中的 session」時透過這裡通知。
let handler: (() => void) | null = null;

export const setUnauthorizedHandler = (fn: (() => void) | null): void => {
  handler = fn;
};

export const notifyUnauthorized = (): void => {
  handler?.();
};
