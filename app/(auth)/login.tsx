import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { colors, spacing } from "@/constants/colors";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.requestMagicLink(trimmed);
      router.push({ pathname: "/(auth)/verify", params: { email: trimmed } });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>KeepLink</Text>
        <Text style={styles.tagline}>Sign in with your email</Text>

        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.btnText}>Send Code</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  logo: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.accent,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  btn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
});
