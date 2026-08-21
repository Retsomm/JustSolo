import { Pressable, StyleSheet, Text, View } from "react-native";
import { buildPaginationItems } from "@justsolo/shared";

import { useOrganicTheme } from "@/hooks/useOrganicTheme";
import { FontFamily, OrganicSpacing } from "@/constants/organicTheme";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export const Pagination = ({ page, totalPages, onPageChange }: PaginationProps) => {
  const theme = useOrganicTheme();

  if (totalPages <= 1) return null;

  const items = buildPaginationItems(page, totalPages);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="上一頁"
        disabled={page <= 1}
        onPress={() => onPageChange(page - 1)}
        style={[styles.arrow, { borderColor: theme.border }, page <= 1 && styles.disabled]}
      >
        <Text style={{ color: theme.text, fontFamily: FontFamily.bodyBold }}>‹</Text>
      </Pressable>

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <Text
            key={`ellipsis-${index}`}
            style={[styles.ellipsis, { color: theme.textSecondary }]}
          >
            ..
          </Text>
        ) : (
          <Pressable
            key={item}
            accessibilityRole="button"
            onPress={() => onPageChange(item)}
            style={[
              styles.pageButton,
              item === page
                ? { backgroundColor: theme.accent }
                : { borderWidth: 1, borderColor: theme.border },
            ]}
          >
            <Text
              style={{
                fontFamily: FontFamily.bodyBold,
                fontSize: 13,
                color: item === page ? theme.accentText : theme.text,
              }}
            >
              {item}
            </Text>
          </Pressable>
        ),
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="下一頁"
        disabled={page >= totalPages}
        onPress={() => onPageChange(page + 1)}
        style={[styles.arrow, { borderColor: theme.border }, page >= totalPages && styles.disabled]}
      >
        <Text style={{ color: theme.text, fontFamily: FontFamily.bodyBold }}>›</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: OrganicSpacing[1],
    paddingVertical: OrganicSpacing[2],
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.4,
  },
  pageButton: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: OrganicSpacing[2],
  },
  ellipsis: {
    fontFamily: FontFamily.body,
    paddingHorizontal: 4,
  },
});
