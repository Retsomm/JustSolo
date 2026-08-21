import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import type { CategoryOption } from "@justsolo/shared";

import { useOrganicTheme } from "@/hooks/useOrganicTheme";
import { FontFamily, OrganicRadius, OrganicSpacing } from "@/constants/organicTheme";

type ChipListProps = {
  label: string;
  options: string[];
  selected: string | undefined;
  onSelect: (value: string | undefined) => void;
};

const ChipList = ({ label, options, selected, onSelect }: ChipListProps) => {
  const theme = useOrganicTheme();

  return (
    <View style={styles.chipSection}>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {options.map((option) => {
          const isSelected = option === selected;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(isSelected ? undefined : option)}
              style={[
                styles.chip,
                isSelected
                  ? { backgroundColor: theme.accent }
                  : { borderWidth: 1, borderColor: theme.border },
              ]}
            >
              <Text
                style={[
                  styles.chipLabel,
                  { color: isSelected ? theme.accentText : theme.text },
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

type FilterBarProps = {
  categories: CategoryOption[];
  districts: string[];
  category: string | undefined;
  onCategoryChange: (value: string | undefined) => void;
  district: string | undefined;
  onDistrictChange: (value: string | undefined) => void;
  keyword: string;
  onKeywordChange: (value: string) => void;
  soloSeatOnly: boolean;
  onSoloSeatOnlyChange: (value: boolean) => void;
};

export const FilterBar = ({
  categories,
  districts,
  category,
  onCategoryChange,
  district,
  onDistrictChange,
  keyword,
  onKeywordChange,
  soloSeatOnly,
  onSoloSeatOnlyChange,
}: FilterBarProps) => {
  const theme = useOrganicTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>搜尋店名</Text>
        <TextInput
          value={keyword}
          onChangeText={onKeywordChange}
          placeholder="例如：砂鍋粥"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />
      </View>

      {categories.length > 0 && (
        <ChipList
          label="分類"
          options={categories.map((c) => c.name)}
          selected={category}
          onSelect={onCategoryChange}
        />
      )}

      {districts.length > 0 && (
        <ChipList label="行政區" options={districts} selected={district} onSelect={onDistrictChange} />
      )}

      <View style={styles.switchRow}>
        <Text style={[styles.switchLabel, { color: theme.text }]}>僅顯示有單人座位</Text>
        <Switch
          value={soloSeatOnly}
          onValueChange={onSoloSeatOnlyChange}
          trackColor={{ false: theme.border, true: theme.accent }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: OrganicSpacing[3],
    padding: OrganicSpacing[3],
    borderRadius: OrganicRadius.lg,
  },
  fieldLabel: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: OrganicRadius.pill,
    paddingHorizontal: OrganicSpacing[4],
    paddingVertical: OrganicSpacing[2],
    fontFamily: FontFamily.body,
    fontSize: 14,
  },
  chipSection: {
    gap: OrganicSpacing[1],
  },
  chipRow: {
    flexDirection: "row",
    gap: OrganicSpacing[1],
    paddingVertical: 2,
  },
  chip: {
    borderRadius: OrganicRadius.pill,
    paddingHorizontal: OrganicSpacing[3],
    paddingVertical: OrganicSpacing[1],
  },
  chipLabel: {
    fontFamily: FontFamily.body,
    fontSize: 13,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: {
    fontFamily: FontFamily.body,
    fontSize: 14,
  },
});
