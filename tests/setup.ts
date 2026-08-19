import "@testing-library/jest-dom/vitest";

// jsdom 沒有實作 matchMedia，元件只要碰到 window.matchMedia（例如主題切換
// 讀系統深色模式偏好）在測試環境就會直接炸掉，這裡補一個預設「不是深色模式」的假實作。
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
