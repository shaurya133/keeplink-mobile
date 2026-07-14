import { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { useShareIntent } from "expo-share-intent";
import { getToken } from "@/lib/auth";
import { api } from "@/lib/api";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const { hasShareIntent, shareIntent, resetShareIntent, error } =
    useShareIntent();

  // Auth guard on mount
  useEffect(() => {
    getToken().then((token: string | null) => {
      if (!token) {
        router.replace("/(auth)/login");
      }
      setReady(true);
    });
  }, []);

  // Handle incoming share intent (Android share sheet)
  useEffect(() => {
    if (!hasShareIntent || !shareIntent) return;

    const url = shareIntent.text?.trim();
    if (!url) {
      resetShareIntent();
      return;
    }

    getToken().then(async (token: string | null) => {
      if (!token) {
        // Not logged in — go to login, the URL will be lost (acceptable)
        router.replace("/(auth)/login");
        resetShareIntent();
        return;
      }

      try {
        await api.createLink(url);
        // Navigate to the links list so the user sees the saved link
        router.replace("/(app)");
      } catch {
        // Already saved or invalid URL — still navigate home
        router.replace("/(app)");
      } finally {
        resetShareIntent();
      }
    });
  }, [hasShareIntent, shareIntent]);

  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}
