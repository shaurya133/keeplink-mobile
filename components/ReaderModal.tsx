import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import {
  cacheContent,
  cacheLinkMeta,
  deleteCache,
  isCached,
  loadContent,
  splitIntoParagraphs,
} from "@/lib/offline";
import { colors, spacing } from "@/constants/colors";

interface ReaderModalProps {
  visible: boolean;
  onClose: () => void;
  linkId: string;
  linkTitle: string | null;
  linkDomain?: string;
  userId: string | null;
  scrollToHighlight?: string;
}

type Status = "loading" | "ready" | "no-content" | "error";

export function ReaderModal({ visible, onClose, linkId, linkTitle, linkDomain, userId, scrollToHighlight }: ReaderModalProps) {
  const [paragraphs, setParagraphs] = useState<string[][]>([]);
  const [highlights, setHighlights] = useState<Map<string, string>>(new Map());
  const [status, setStatus] = useState<Status>("loading");
  const [offline, setOffline] = useState(false);
  const [cached, setCached] = useState(false);
  const [caching, setCaching] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const hasScrolled = useRef(false);

  useEffect(() => {
    if (!visible) return;
    hasScrolled.current = false;
    load();
  }, [visible, linkId]);

  async function load() {
    setStatus("loading");
    setParagraphs([]);

    try {
      const saved = await api.getHighlights(linkId);
      setHighlights(new Map(saved.map((h) => [h.text, h.id])));
    } catch {
      // offline — highlights won't load, that's fine
    }

    if (userId) {
      const isAlreadyCached = await isCached(userId, linkId);
      setCached(isAlreadyCached);

      const localContent = await loadContent(userId, linkId);
      if (localContent) {
        setParagraphs(splitIntoParagraphs(localContent));
        setOffline(false);
        setStatus("ready");
        return;
      }
    }

    try {
      const link = await api.getLink(linkId);
      if (!link.content) {
        setStatus("no-content");
        return;
      }
      setParagraphs(splitIntoParagraphs(link.content));
      setStatus("ready");
      setOffline(false);
    } catch {
      setOffline(true);
      setStatus("no-content");
    }
  }

  async function handleCacheToggle() {
    if (!userId) return;

    if (cached) {
      await deleteCache(userId, linkId);
      setCached(false);
      return;
    }
    setCaching(true);
    try {
      const link = await api.getLink(linkId);
      if (link.content) {
        await cacheContent(userId, linkId, link.content);
        await cacheLinkMeta(userId, linkId, {
          id: link.id,
          url: link.url,
          title: link.title,
          description: link.description,
          thumbnail: link.thumbnail,
          favicon: link.favicon,
          domain: link.domain,
          readingTime: link.readingTime,
          savedAt: Date.now(),
        });
        setCached(true);
      }
    } finally {
      setCaching(false);
    }
  }

  async function toggleHighlight(sentence: string) {
    if (highlights.has(sentence)) {
      const id = highlights.get(sentence)!;
      setHighlights((prev) => { const next = new Map(prev); next.delete(sentence); return next; });
      api.deleteHighlight(id).catch(() => {
        setHighlights((prev) => new Map(prev).set(sentence, id));
      });
    } else {
      const tempId = `temp_${Date.now()}`;
      setHighlights((prev) => new Map(prev).set(sentence, tempId));
      try {
        const { id } = await api.addHighlight(linkId, sentence);
        setHighlights((prev) => new Map(prev).set(sentence, id));
      } catch {
        setHighlights((prev) => { const next = new Map(prev); next.delete(sentence); return next; });
      }
    }
  }

  function handleClose() {
    setStatus("loading");
    setParagraphs([]);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.back}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>{linkTitle ?? "Article"}</Text>
          <TouchableOpacity
            onPress={handleCacheToggle}
            disabled={caching || status !== "ready" || !userId}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            {caching ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={[styles.cacheBtn, cached && styles.cacheBtnActive]}>
                {cached ? "⬇ Saved" : "⬇ Save"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {offline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>Offline mode</Text>
          </View>
        )}

        {status === "loading" && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        )}

        {status === "no-content" && (
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              {offline
                ? "No offline copy saved. Connect to the internet and tap ⬇ Save to read offline."
                : "No readable content found for this link."}
            </Text>
          </View>
        )}

        {status === "error" && (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Failed to load article.</Text>
          </View>
        )}

        {status === "ready" && (
          <>
            <View style={styles.hint}>
              <Text style={styles.hintText}>Long-press any sentence to highlight it</Text>
            </View>
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
            >
              {paragraphs.map((sentences, pi) => {
                const isTargetParagraph = scrollToHighlight
                  ? sentences.includes(scrollToHighlight)
                  : false;
                return (
                  <View
                    key={pi}
                    onLayout={isTargetParagraph ? (e) => {
                      if (!hasScrolled.current) {
                        hasScrolled.current = true;
                        scrollRef.current?.scrollTo({ y: e.nativeEvent.layout.y, animated: true });
                      }
                    } : undefined}
                  >
                    <Text style={styles.para}>
                      {sentences.map((sentence, si) => {
                        const isHighlighted = highlights.has(sentence);
                        return (
                          <Text
                            key={si}
                            onLongPress={() => toggleHighlight(sentence)}
                            style={isHighlighted ? styles.sentenceHighlighted : styles.sentence}
                          >
                            {sentence}{" "}
                          </Text>
                        );
                      })}
                    </Text>
                  </View>
                );
              })}

              {highlights.size > 0 && (
                <View style={styles.highlightsSection}>
                  <Text style={styles.highlightsSectionTitle}>Your Highlights</Text>
                  {Array.from(highlights.keys()).map((h, i) => (
                    <Pressable key={i} style={styles.highlightCard} onPress={() => toggleHighlight(h)}>
                      <Text style={styles.highlightText}>{h}</Text>
                      <Text style={styles.removeHighlight}>Hold to remove</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>
          </>
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
  back: { fontSize: 18, color: colors.textMuted },
  title: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.text },
  cacheBtn: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
  cacheBtnActive: { color: colors.accent },
  offlineBanner: {
    backgroundColor: colors.accentLight,
    paddingVertical: spacing.xs,
    alignItems: "center",
  },
  offlineBannerText: { fontSize: 12, color: colors.accent, fontWeight: "600" },
  hint: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  hintText: { fontSize: 12, color: colors.textMuted, fontStyle: "italic" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxxl,
  },
  emptyText: { color: colors.textMuted, fontSize: 15, textAlign: "center", lineHeight: 22 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  para: {
    fontSize: 17,
    lineHeight: 30,
    color: colors.text,
  },
  sentence: {
    fontSize: 17,
    lineHeight: 30,
    color: colors.text,
  },
  sentenceHighlighted: {
    fontSize: 17,
    lineHeight: 30,
    color: "#3d2e00",
    backgroundColor: "#fff3c4",
  },
  highlightsSection: {
    marginTop: spacing.xxxl,
    borderTopWidth: 2,
    borderTopColor: colors.divider,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  highlightsSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  highlightCard: {
    backgroundColor: "#fff3c4",
    padding: spacing.md,
    borderRadius: 4,
    gap: spacing.xs,
  },
  highlightText: { fontSize: 15, lineHeight: 22, color: "#3d2e00" },
  removeHighlight: { fontSize: 11, color: "#a08030", alignSelf: "flex-end" },
});
