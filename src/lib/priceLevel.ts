const PRICE_LEVEL_LABELS: Record<string, string> = {
  PRICE_LEVEL_FREE: "免費",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
};

export const priceLevelLabel = (priceLevel: string | null): string | null =>
  priceLevel ? (PRICE_LEVEL_LABELS[priceLevel] ?? null) : null;
