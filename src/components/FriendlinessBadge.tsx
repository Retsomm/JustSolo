type FriendlinessBadgeProps = {
  score: number;
  label: string;
};

const toneClassName = (score: number): string => {
  if (score >= 65) return "bg-(--color-accent-2-100) text-(--color-accent-2-800)";
  if (score >= 35) return "bg-foreground/5 text-foreground/70";
  return "bg-danger/15 text-danger";
};

export const FriendlinessBadge = ({ score, label }: FriendlinessBadgeProps) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${toneClassName(score)}`}
  >
    {label}
    <span className="text-[0.65rem] opacity-70">{score}</span>
  </span>
);
