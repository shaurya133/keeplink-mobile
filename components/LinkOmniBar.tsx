import { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
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
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Paste a URL…"
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={setValue}
          onSubmitEditing={handleSubmit}
          returnKeyType="go"
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
      </View>
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
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.divider,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
    minHeight: 48,
  },
  btn: {
    backgroundColor: colors.accent,
    width: 80,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: colors.surface,
    fontWeight: "600",
    fontSize: 15,
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
