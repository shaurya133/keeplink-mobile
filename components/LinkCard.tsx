import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { colors, spacing } from "@/constants/colors";
import type { LinkWithTags } from "@/lib/types";
import { api } from "@/lib/api";
import { ReaderModal } from "@/components/ReaderModal";

interface LinkCardProps {
  link: LinkWithTags;
  onRefresh: () => void;
  onAskAI?: (linkId: string, linkTitle: string) => void;
}

export function LinkCard({ link, onRefresh, onAskAI }: LinkCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);

  async function open() {
    await WebBrowser.openBrowserAsync(link.url);
  }

  async function markRead() {
    setMenuOpen(false);
    await api.markRead(link.id);
    onRefresh();
  }

  async function markUnread() {
    setMenuOpen(false);
    await api.markUnread(link.id);
    onRefresh();
  }

  async function archive() {
    setMenuOpen(false);
    await api.archiveLink(link.id);
    onRefresh();
  }

  function remove() {
    setMenuOpen(false);
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
    <>
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
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setMenuOpen(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.menuBtnText}>•••</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.thumbnailContainer}>
            {link.thumbnail ? (
              <Image source={{ uri: link.thumbnail }} style={styles.thumbnail} />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Text style={styles.thumbnailInitial}>
                  {(link.domain ?? link.url).replace(/^www\./, "").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.title} numberOfLines={2}>
              {link.title ?? link.url}
            </Text>
            <Text style={styles.description} numberOfLines={1}>
              {link.description ?? link.domain}
            </Text>
            {tags.length > 0 ? (
              <View style={styles.tags}>
                {tags.slice(0, 3).map((tag: import("@/lib/types").Tag) => (
                  <View key={tag.id} style={styles.tag}>
                    <Text style={styles.tagText}>{tag.name}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>

      <ReaderModal
        visible={readerOpen}
        onClose={() => setReaderOpen(false)}
        linkId={link.id}
        linkTitle={link.title}
        linkDomain={link.domain}
      />

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {link.title ?? link.url}
            </Text>

            <TouchableOpacity
              style={styles.sheetItem}
              onPress={() => { setMenuOpen(false); setReaderOpen(true); }}
            >
              <Text style={[styles.sheetItemText, styles.readerText]}>Read Offline</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetItem} onPress={link.status === "UNREAD" ? markRead : markUnread}>
              <Text style={styles.sheetItemText}>
                {link.status === "UNREAD" ? "Mark as Read" : "Mark as Unread"}
              </Text>
            </TouchableOpacity>

            {link.status !== "ARCHIVED" ? (
              <TouchableOpacity style={styles.sheetItem} onPress={archive}>
                <Text style={styles.sheetItemText}>Archive</Text>
              </TouchableOpacity>
            ) : null}

            {onAskAI ? (
              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => {
                  setMenuOpen(false);
                  onAskAI(link.id, link.title ?? link.url);
                }}
              >
                <Text style={[styles.sheetItemText, styles.aiText]}>Ask AI</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={[styles.sheetItem, styles.sheetItemLast]} onPress={remove}>
              <Text style={[styles.sheetItemText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setMenuOpen(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  menuBtn: {
    paddingLeft: spacing.sm,
  },
  menuBtnText: {
    fontSize: 14,
    color: colors.textMuted,
    letterSpacing: 1,
    fontWeight: "700",
  },
  body: {
    flexDirection: "row",
    gap: spacing.md,
    height: 80,
  },
  thumbnailContainer: {
    width: 72,
    height: 80,
    flexShrink: 0,
  },
  thumbnail: {
    width: 72,
    height: 80,
  },
  thumbnailPlaceholder: {
    width: 72,
    height: 80,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailInitial: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.accent,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs,
    overflow: "hidden",
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
    flexWrap: "nowrap",
    gap: spacing.xs,
    overflow: "hidden",
  },
  tag: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    flexShrink: 0,
  },
  tagText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: "500",
  },
  // Action sheet
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: spacing.xxxl,
    overflow: "hidden",
  },
  sheetTitle: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sheetItem: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sheetItemLast: {
    borderBottomWidth: 0,
  },
  sheetItemText: {
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
  },
  readerText: {
    color: colors.text,
    fontWeight: "600",
  },
  aiText: {
    color: colors.accent,
    fontWeight: "600",
  },
  deleteText: {
    color: colors.error,
  },
  cancelBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.bg,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
});
