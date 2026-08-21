import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";

import { OrganicColors, type OrganicColorScheme } from "@/constants/organicTheme";

type ThemeContextValue = {
  scheme: OrganicColorScheme;
  toggleScheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const OrganicThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<OrganicColorScheme | null>(null);
  const scheme: OrganicColorScheme = override ?? (systemScheme === "dark" ? "dark" : "light");

  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      toggleScheme: () => setOverride(scheme === "dark" ? "light" : "dark"),
    }),
    [scheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

const useThemeContext = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useOrganicTheme must be used within OrganicThemeProvider");
  return ctx;
};

export const useOrganicTheme = () => {
  const { scheme } = useThemeContext();
  return OrganicColors[scheme];
};

export const useThemeToggle = () => useThemeContext();
