import { useState, useCallback } from "react";
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
import { clearToken } from "@/lib/auth";
import { api } from "@/lib/api";
import { router } from "expo-router";
import { FilterTabs } from "@/components/FilterTabs";
import { LinkOmniBar } from "@/components/LinkOmniBar";
import { LinkCard } from "@/components/LinkCard";
import { ChatModal } from "@/components/ChatModal";
import { colors, spacing } from "@/constants/colors";
import type { LinkWithTags } from "@/lib/types";

export default function LinksScreen() {
  const [links, setLinks] = useState<LinkWithTags[]>([]);
  const [status, setStatus] = useState("unread");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatLinkId, setChatLinkId] = useState<string | undefined>();
  const [chatLinkTitle, setChatLinkTitle] = useState<string | undefined>();

  function openChat(linkId?: string, linkTitle?: string) {
    setChatLinkId(linkId);
    setChatLinkTitle(linkTitle);
    setChatVisible(true);
  }

  async function fetchLinks(currentStatus = status) {
    try {
      const data = await api.getLinks({ status: currentStatus });
      setLinks(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Refresh whenever the screen comes into focus (e.g. after share intent saves a link)
  useFocusEffect(
    useCallback(() => {
      fetchLinks();
    }, [status])
  );

  function handleStatusChange(next: string) {
    setStatus(next);
    setLoading(true);
    fetchLinks(next);
  }

  async function handleSave(url: string) {
    await api.createLink(url);
    fetchLinks();
  }

  async function handleSignOut() {
    await clearToken();
    router.replace("/(auth)/login");
  }

  function renderEmpty() {
    if (loading) return null;
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No links here yet.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.navBar}>
        <Text style={styles.brand}>KeepLink</Text>
        <View style={styles.navActions}>
          <TouchableOpacity onPress={() => openChat()}>
            <Text style={styles.askAI}>Ask AI</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut}>
            <Text style={styles.signOut}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <LinkOmniBar onSave={handleSave} />
      <FilterTabs active={status} onChange={handleStatusChange} />

      <ChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        linkId={chatLinkId}
        linkTitle={chatLinkTitle}
      />

      <FlatList
        data={links}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LinkCard
            link={item}
            onRefresh={() => fetchLinks()}
            onAskAI={(id, title) => openChat(id, title)}
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
  askAI: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: "600",
  },
  signOut: {
    fontSize: 14,
    color: colors.textMuted,
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
  },
});
