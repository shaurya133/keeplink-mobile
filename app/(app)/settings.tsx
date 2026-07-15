import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { clearToken, clearUserId, getUserId } from "@/lib/auth";
import { clearUserCache } from "@/lib/offline";
import { api } from "@/lib/api";
import { colors, spacing } from "@/constants/colors";

export default function SettingsScreen() {
  const [deleting, setDeleting] = useState(false);

  async function handleSignOut() {
    const uid = await getUserId();
    if (uid) await clearUserCache(uid);
    await clearUserId();
    await clearToken();
    router.replace("/(auth)/login");
  }

  function confirmDeleteAccount() {
    Alert.alert(
      "Delete account",
      "This permanently deletes your account, all saved links, and highlights. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: deleteAccount,
        },
      ]
    );
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      await api.deleteAccount();
      const uid = await getUserId();
      if (uid) await clearUserCache(uid);
      await clearUserId();
      await clearToken();
      router.replace("/(auth)/login");
    } catch (e: unknown) {
      setDeleting(false);
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      Alert.alert("Error", msg);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={handleSignOut}>
          <Text style={styles.rowText}>Sign out</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.row}
          onPress={confirmDeleteAccount}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <Text style={[styles.rowText, styles.destructive]}>
              Delete account
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: spacing.xl,
  },
  section: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.divider,
  },
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 52,
    justifyContent: "center",
  },
  rowText: {
    fontSize: 16,
    color: colors.text,
  },
  destructive: {
    color: colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: spacing.lg,
  },
});
