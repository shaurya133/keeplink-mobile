import { useState, useCallback, useEffect } from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/auth";
import { listCachedLinks } from "@/lib/offline";
import { router } from "expo-router";
import { FilterTabs } from "@/components/FilterTabs";
import { LinkOmniBar } from "@/components/LinkOmniBar";
import { LinkCard } from "@/components/LinkCard";
import { ChatModal } from "@/components/ChatModal";
import { HighlightsModal } from "@/components/HighlightsModal";
import { ReaderModal } from "@/components/ReaderModal";
import { colors, spacing } from "@/constants/colors";
import type { LinkWithTags, CachedLinkMeta } from "@/lib/types";

export default function LinksScreen() {
  const [links, setLinks] = useState<LinkWithTags[]>([]);
  const [status, setStatus] = useState("unread");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatLinkId, setChatLinkId] = useState<string | undefined>();
  const [chatLinkTitle, setChatLinkTitle] = useState<string | undefined>();
  const [highlightsVisible, setHighlightsVisible] = useState(false);
  const [readerLinkId, setReaderLinkId] = useState<string | null>(null);
  const [readerLinkTitle, setReaderLinkTitle] = useState<string | null>(null);
  const [userId, setUserIdState] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    getUserId().then(setUserIdState);
  }, []);

  function openChat(linkId?: string, linkTitle?: string) {
    setChatLinkId(linkId);
    setChatLinkTitle(linkTitle);
    setChatVisible(true);
  }

  function openReaderFromHighlights(linkId: string, linkTitle: string) {
    setReaderLinkId(linkId);
    setReaderLinkTitle(linkTitle);
  }

  async function fetchLinks(currentStatus = status) {
    if (currentStatus === "saved") {
      await fetchSavedLinks();
      return;
    }

    try {
      const data = await api.getLinks({ status: currentStatus });
      setLinks(data);
      setOffline(false);
    } catch {
      setOffline(true);
      await fetchSavedLinks();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function fetchSavedLinks() {
    if (!userId) {
      setLinks([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const cached = await listCachedLinks(userId);
    const asLinks: LinkWithTags[] = cached.map((m: CachedLinkMeta) => ({
      id: m.id,
      url: m.url,
      title: m.title,
      description: m.description,
      thumbnail: m.thumbnail,
      favicon: m.favicon,
      domain: m.domain,
      readingTime: m.readingTime,
      content: null,
      status: "READ" as const,
      addedAt: new Date(m.savedAt).toISOString(),
      readAt: null,
      archivedAt: null,
      tags: [],
    }));
    setLinks(asLinks);
    setLoading(false);
    setRefreshing(false);
  }

  useFocusEffect(
    useCallback(() => {
      if (userId !== null) fetchLinks();
    }, [status, userId])
  );

  function handleStatusChange(next: string) {
    setStatus(next);
    setLoading(true);
    if (next !== "saved") setOffline(false);
    fetchLinks(next);
  }

  async function handleSave(url: string) {
    await api.createLink(url);
    fetchLinks();
  }

  function renderEmpty() {
    if (loading) return null;
    if (offline && status !== "saved") {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            You're offline. Switch to the Saved tab to read downloaded articles.
          </Text>
        </View>
      );
    }
    if (status === "saved") {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No saved articles yet. Open an article and tap ⬇ Save to read it offline.
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No links here yet.</Text>
      </View>
    );
  }

  const isSavedTab = status === "saved";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.navBar}>
        <Text style={styles.brand}>KeepLink</Text>
        <View style={styles.navActions}>
          <TouchableOpacity onPress={() => setHighlightsVisible(true)}>
            <Text style={styles.highlights}>Highlights</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openChat()}>
            <Text style={styles.askAI}>Ask AI</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(app)/settings")}>
            <Text style={styles.signOut}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!offline && <LinkOmniBar onSave={handleSave} />}

      {offline && status !== "saved" && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>You're offline</Text>
        </View>
      )}

      <FilterTabs active={status} onChange={handleStatusChange} />

      <ChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        linkId={chatLinkId}
        linkTitle={chatLinkTitle}
      />

      <HighlightsModal
        visible={highlightsVisible}
        onClose={() => setHighlightsVisible(false)}
        onOpenReader={openReaderFromHighlights}
      />

      {readerLinkId && (
        <ReaderModal
          visible={readerLinkId !== null}
          onClose={() => { setReaderLinkId(null); setReaderLinkTitle(null); }}
          linkId={readerLinkId}
          linkTitle={readerLinkTitle}
          userId={userId}
        />
      )}

      <FlatList
        data={links}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LinkCard
            link={item}
            onRefresh={() => fetchLinks()}
            onAskAI={isSavedTab ? undefined : (id, title) => openChat(id, title)}
            userId={userId}
          />
        )}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchLinks();
            }}
            tintColor={colors.accent}
          />
        }
        contentContainerStyle={links.length === 0 ? styles.emptyContainer : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.divider,
  },
  brand: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: -0.5,
  },
  navActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  highlights: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "600",
  },
  askAI: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: "600",
  },
  signOut: {
    fontSize: 14,
    color: colors.textMuted,
  },
  offlineBanner: {
    backgroundColor: colors.accentLight,
    paddingVertical: spacing.xs,
    alignItems: "center",
  },
  offlineBannerText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: "600",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: spacing.xxl,
    lineHeight: 22,
  },
});
