import { useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import Constants from "expo-constants";
import { getToken } from "@/lib/auth";
import { colors, spacing } from "@/constants/colors";

const BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://10.0.2.2:3000";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  linkId?: string;
  linkTitle?: string;
}

export function ChatModal({ visible, onClose, linkId, linkTitle }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<FlatList>(null);

  const heading = linkTitle ?? "Ask about your links";
  const displayTitle = linkTitle && linkTitle.length > 40
    ? linkTitle.slice(0, 40) + "…"
    : linkTitle;
  const placeholder = displayTitle
    ? `Ask about "${displayTitle}"…`
    : "What have you saved about…";

  function handleClose() {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setLoading(false);
    onClose();
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Math.random().toString(36), role: "user", content: text };
    const assistantId = Math.random().toString(36);

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setInput("");
    setLoading(true);

    const history = [...messages, userMsg].map(({ role, content }) => ({ role, content }));
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: history, ...(linkId ? { linkId } : {}) }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) throw new Error("Chat request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        );
        listRef.current?.scrollToEnd({ animated: false });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Sorry, something went wrong. Please try again." }
              : m
          )
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading} numberOfLines={1}>{heading}</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            style={styles.messageList}
            contentContainerStyle={styles.messageContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {linkTitle
                  ? "Ask me anything about this article."
                  : "Ask me about your saved links — topics, recommendations, or anything else."}
              </Text>
            }
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.assistantBubble]}>
                {item.role === "assistant" && !item.content && loading ? (
                  <ActivityIndicator size="small" color={colors.textMuted} />
                ) : (
                  <Text style={[styles.bubbleText, item.role === "user" && styles.userBubbleText]}>
                    {item.content}
                  </Text>
                )}
              </View>
            )}
          />

          <View style={styles.footer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={1000}
              editable={!loading}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (loading || !input.trim()) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={loading || !input.trim()}
            >
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  heading: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    marginRight: spacing.md,
  },
  closeBtn: {
    fontSize: 18,
    color: colors.textMuted,
  },
  messageList: { flex: 1 },
  messageContent: {
    padding: spacing.lg,
    gap: spacing.md,
    flexGrow: 1,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    marginTop: spacing.xxxl,
  },
  bubble: {
    maxWidth: "85%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 2,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.accent,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    minWidth: 40,
    minHeight: 32,
    justifyContent: "center",
  },
  bubbleText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  userBubbleText: {
    color: colors.surface,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.divider,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: {
    color: colors.surface,
    fontWeight: "600",
    fontSize: 15,
  },
});
