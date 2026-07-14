import { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { colors, spacing } from "@/constants/colors";

function isUrl(s: string) {
  try {
    const u = new URL(s.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

interface LinkOmniBarProps {
  onSave: (url: string) => Promise<void>;
}

export function LinkOmniBar({ onSave }: LinkOmniBarProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // Check clipboard on focus
  async function handleFocus() {
    const clip = await Clipboard.getStringAsync();
    if (clip && isUrl(clip) && clip !== value) {
      setValue(clip);
    }
  }

  async function handleSubmit() {
    const url = value.trim();
    if (!isUrl(url)) {
      setMessage({ text: "Enter a valid URL", ok: false });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await onSave(url);
      setValue("");
      setMessage({ text: "Saved!", ok: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      setMessage({ text: msg, ok: false });
    } finally {
      setLoading(false);
    }

    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Paste a URL to save it here…"
        placeholderTextColor="#9e9b96"
        value={value}
        onChangeText={setValue}
        onFocus={handleFocus}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.surface} size="small" />
        ) : (
          <Text style={styles.btnText}>Save</Text>
        )}
      </TouchableOpacity>
      {message ? (
        <Text style={[styles.message, !message.ok && styles.messageError]}>
          {message.text}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
    borderBottomColor: colors.divider,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.divider,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  btn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: colors.surface,
    fontWeight: "600",
    fontSize: 14,
  },
  message: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: "500",
  },
  messageError: {
    color: colors.error,
  },
});
