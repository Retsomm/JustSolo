type FriendlinessBadgeProps = {
  score: number;
  label: string;
};

const toneClassName = (score: number): string => {
  if (score >= 65) return "bg-(--color-accent-2-100) text-(--color-accent-2-800)";
  if (score >= 35) return "bg-foreground/5 text-foreground/70";
  return "bg-danger/15 text-danger";
};

// score 只用來決定顏色深淺（toneClassName），不直接顯示數字——App 裡沒有任何
// 地方說明這個 0-100 分是怎麼算出來的，2026-08-22 使用者反應看到裸數字（例如
// 「未知，建議致電確認 40」）會誤以為是別的意思（信心百分比／評分），
// 決定只留文字標籤。
export const FriendlinessBadge = ({ score, label }: FriendlinessBadgeProps) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${toneClassName(score)}`}
  >
    {label}
  </span>
);
