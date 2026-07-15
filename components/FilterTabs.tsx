import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { colors, spacing } from "@/constants/colors";

const TABS = [
  { label: "Unread", value: "unread" },
  { label: "Read", value: "read" },
  { label: "Archived", value: "archived" },
  { label: "All", value: "all" },
  { label: "⬇ Saved", value: "saved" },
] as const;

interface FilterTabsProps {
  active: string;
  onChange: (status: string) => void;
}

export function FilterTabs({ active, onChange }: FilterTabsProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {TABS.map((tab) => {
          const isActive = active === tab.value;
          return (
            <TouchableOpacity
              key={tab.value}
              onPress={() => onChange(tab.value)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 2,
    borderBottomColor: colors.divider,
    marginBottom: spacing.md,
  },
  container: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginBottom: -2,
  },
  tabActive: {
    borderBottomColor: colors.accent,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.accent,
  },
});
