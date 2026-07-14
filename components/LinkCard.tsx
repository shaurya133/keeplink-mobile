import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { colors, spacing } from "@/constants/colors";
import type { LinkWithTags } from "@/lib/types";
import { api } from "@/lib/api";

interface LinkCardProps {
  link: LinkWithTags;
  onRefresh: () => void;
  onAskAI?: (linkId: string, linkTitle: string) => void;
}

export function LinkCard({ link, onRefresh, onAskAI }: LinkCardProps) {
  async function open() {
    await WebBrowser.openBrowserAsync(link.url);
  }

  async function markRead() {
    await api.markRead(link.id);
    onRefresh();
  }

  async function markUnread() {
    await api.markUnread(link.id);
    onRefresh();
  }

  async function archive() {
    await api.archiveLink(link.id);
    onRefresh();
  }

  async function remove() {
    Alert.alert("Delete link?", link.title ?? link.url, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.deleteLink(link.id);
          onRefresh();
        },
      },
    ]);
  }

  const tags = link.tags.map((t: { tag: import("@/lib/types").Tag }) => t.tag);

  return (
    <TouchableOpacity style={styles.card} onPress={open} activeOpacity={0.85}>
      <View style={styles.header}>
        {link.favicon ? (
          <Image source={{ uri: link.favicon }} style={styles.favicon} />
        ) : null}
        <Text style={styles.domain} numberOfLines={1}>
          {link.domain}
        </Text>
        {link.readingTime ? (
          <Text style={styles.readingTime}>{link.readingTime} min</Text>
        ) : null}
      </View>

      <View style={styles.body}>
        {link.thumbnail ? (
          <Image source={{ uri: link.thumbnail }} style={styles.thumbnail} />
        ) : null}
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={2}>
            {link.title ?? link.url}
          </Text>
          {link.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {link.description}
            </Text>
          ) : null}
        </View>
      </View>

      {tags.length > 0 ? (
        <View style={styles.tags}>
          {tags.map((tag: import("@/lib/types").Tag) => (
            <View key={tag.id} style={styles.tag}>
              <Text style={styles.tagText}>{tag.name}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        {link.status === "UNREAD" ? (
          <TouchableOpacity style={styles.actionBtn} onPress={markRead}>
            <Text style={styles.actionText}>Mark Read</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={markUnread}>
            <Text style={styles.actionText}>Mark Unread</Text>
          </TouchableOpacity>
        )}
        {link.status !== "ARCHIVED" ? (
          <TouchableOpacity style={styles.actionBtn} onPress={archive}>
            <Text style={styles.actionText}>Archive</Text>
          </TouchableOpacity>
        ) : null}
        {onAskAI ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.aiBtn]}
            onPress={() => onAskAI(link.id, link.title ?? link.url)}
          >
            <Text style={[styles.actionText, styles.aiText]}>Ask AI</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={remove}>
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.divider,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  favicon: {
    width: 14,
    height: 14,
  },
  domain: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },
  readingTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  body: {
    flexDirection: "row",
    gap: spacing.md,
  },
  thumbnail: {
    width: 72,
    height: 72,
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tag: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  actionText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
  },
  aiBtn: {
    borderColor: colors.accent,
  },
  aiText: {
    color: colors.accent,
  },
  deleteBtn: {
    marginLeft: "auto",
    borderColor: colors.error,
  },
  deleteText: {
    color: colors.error,
  },
});
