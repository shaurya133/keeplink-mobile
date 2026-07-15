import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loadAllHighlights, type HighlightEntry } from "@/lib/offline";
import { colors, spacing } from "@/constants/colors";

interface HighlightsModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenReader: (linkId: string, linkTitle: string) => void;
}

export function HighlightsModal({ visible, onClose, onOpenReader }: HighlightsModalProps) {
  const [entries, setEntries] = useState<HighlightEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    loadAllHighlights()
      .then(setEntries)
      .finally(() => setLoading(false));
  }, [visible]);

  const totalCount = entries.reduce((n, e) => n + e.sentences.length, 0);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Highlights</Text>
            {!loading && totalCount > 0 && (
              <Text style={styles.subtitle}>{totalCount} highlight{totalCount !== 1 ? "s" : ""} across {entries.length} article{entries.length !== 1 ? "s" : ""}</Text>
            )}
          </View>
        </View>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        )}

        {!loading && entries.length === 0 && (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>No highlights yet</Text>
            <Text style={styles.emptyBody}>
              Open any article via Read Offline and long-press a sentence to highlight it.
            </Text>
          </View>
        )}

        {!loading && entries.length > 0 && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {entries.map((entry) => (
              <View key={entry.linkId} style={styles.articleGroup}>
                <TouchableOpacity
                  style={styles.articleHeader}
                  onPress={() => {
                    onClose();
                    onOpenReader(entry.linkId, entry.title);
                  }}
                >
                  <View style={styles.articleMeta}>
                    <Text style={styles.articleDomain}>{entry.domain}</Text>
                    <Text style={styles.articleTitle} numberOfLines={2}>
                      {entry.title || entry.domain}
                    </Text>
                  </View>
                  <Text style={styles.openReader}>Open →</Text>
                </TouchableOpacity>

                {entry.sentences.map((sentence, i) => (
                  <View key={i} style={styles.highlightRow}>
                    <View style={styles.highlightBar} />
                    <Text style={styles.highlightText}>{sentence}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  close: { fontSize: 18, color: colors.textMuted },
  headerText: { flex: 1 },
  title: { fontSize: 17, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxxl,
    gap: spacing.md,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.text, textAlign: "center" },
  emptyBody: { fontSize: 15, color: colors.textMuted, textAlign: "center", lineHeight: 22 },
  scrollContent: { padding: spacing.lg, gap: spacing.xxl, paddingBottom: spacing.xxxl },
  articleGroup: { gap: spacing.md },
  articleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  articleMeta: { flex: 1, gap: 2 },
  articleDomain: { fontSize: 11, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  articleTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  openReader: { fontSize: 13, color: colors.accent, fontWeight: "600" },
  highlightRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  highlightBar: {
    width: 3,
    backgroundColor: "#f0c040",
    borderRadius: 2,
    flexShrink: 0,
  },
  highlightText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
});
