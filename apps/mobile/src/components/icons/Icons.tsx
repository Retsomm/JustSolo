import Svg, { Circle, Path } from "react-native-svg";

type IconProps = {
  color: string;
  size?: number;
};

const strokeProps = {
  fill: "none" as const,
  strokeWidth: 2.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// 圖示的 path 資料全部照抄 ui-app/project/App.dc.html 裡的設計稿。

export const HomeIcon = ({ color, size = 20 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...strokeProps}>
    <Path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </Svg>
);

export const MapIcon = ({ color, size = 20 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...strokeProps}>
    <Path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);

export const HeartIcon = ({ color, size = 20, filled = false }: IconProps & { filled?: boolean }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    stroke={color}
    fill={filled ? color : "none"}
    strokeWidth={2.75}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
  </Svg>
);

export const ProfileIcon = ({ color, size = 20 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...strokeProps}>
    <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

export const ShuffleIcon = ({ color, size = 14 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...strokeProps}>
    <Path d="M3 12a9 9 0 1 0 2.83-6.36L3 8" />
    <Path d="M3 3v5h5" />
  </Svg>
);

export const FilterIcon = ({ color, size = 14 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...strokeProps}>
    <Path d="M22 3H2l8 9.46V19l4 2v-8.54z" />
  </Svg>
);

export const ArrowRightIcon = ({ color, size = 14 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...strokeProps}>
    <Path d="M5 12h14" />
    <Path d="m12 5 7 7-7 7" />
  </Svg>
);

export const BackIcon = ({ color, size = 16 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...strokeProps}>
    <Path d="M15 6l-6 6 6 6" />
  </Svg>
);

export const MoonIcon = ({ color, size = 16 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...strokeProps}>
    <Path d="M12.5 3a9 9 0 1 0 8.5 12.5A7 7 0 1 1 12.5 3z" />
  </Svg>
);

export const SunIcon = ({ color, size = 16 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" stroke={color} {...strokeProps}>
    <Circle cx="12" cy="12" r="4" />
    <Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
);
