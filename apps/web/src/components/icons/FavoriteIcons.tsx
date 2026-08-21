type IconProps = {
  className?: string;
};

const HEART_PATH =
  "M12 21s-6.716-4.35-9.428-8.06C.77 10.242 1.2 6.94 3.6 5.2 5.66 3.7 8.4 4.02 10 5.8L12 8l2-2.2c1.6-1.78 4.34-2.1 6.4-.6 2.4 1.74 2.83 5.04 1.03 7.74C18.716 16.65 12 21 12 21z";

export const HeartFilledIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d={HEART_PATH} />
  </svg>
);

export const HeartOutlineIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d={HEART_PATH} />
  </svg>
);
