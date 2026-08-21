const UNIT_TO_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
};

// 支援 jose 的 setExpirationTime 慣用格式（例如 "30d"、"-1s"），只用來換算
// MobileSession 資料庫紀錄要存的 expiresAt，不影響 JWT 本身的到期判斷（那個
// 完全交給 jose 處理）。
export const parseDurationToSeconds = (duration: string): number => {
  const match = /^(-?\d+)([smhdw])$/.exec(duration.trim());
  if (!match) throw new Error(`無法解析的時間長度: ${duration}`);
  const [, amount, unit] = match;
  return Number(amount) * UNIT_TO_SECONDS[unit];
};
