import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { api } from "@/lib/api";
import { setToken, setUserId } from "@/lib/auth";
import { colors, spacing } from "@/constants/colors";

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  async function handleVerify() {
    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { token: jwt, userId } = await api.verifyToken(email, trimmed);
      await setToken(jwt);
      await setUserId(userId);
      router.replace("/(app)");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Incorrect or expired code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResendMsg(null);
    setError(null);
    try {
      await api.requestMagicLink(email);
      setResendMsg("New code sent.");
      setCode("");
    } catch (e: unknown) {
      setResendMsg(e instanceof Error ? e.message : "Couldn't resend.");
    } finally {
      setResending(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>KeepLink</Text>
      <Text style={styles.heading}>Enter your code</Text>
      <Text style={styles.body}>
        We sent a 6-digit code to{"\n"}
        <Text style={styles.email}>{email}</Text>
      </Text>

      <TextInput
        style={styles.input}
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="123456"
        placeholderTextColor={colors.textMuted}
        autoFocus
        textContentType="oneTimeCode"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {resendMsg ? <Text style={styles.resendMsg}>{resendMsg}</Text> : null}

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={styles.btnText}>Sign in</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendBtn}
        onPress={handleResend}
        disabled={resending}
      >
        <Text style={styles.resendText}>
          {resending ? "Sending…" : "Resend code"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  logo: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.accent,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  body: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  email: {
    color: colors.text,
    fontWeight: "600",
  },
  input: {
    borderWidth: 2,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: 12,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  error: {
    color: colors.error,
    fontSize: 14,
  },
  resendMsg: {
    color: colors.accent,
    fontSize: 14,
  },
  btn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  resendBtn: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  resendText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
