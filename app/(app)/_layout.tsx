import { Stack } from "expo-router";
import { colors } from "@/constants/colors";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { fontWeight: "700", color: colors.text },
        headerShadowVisible: false,
        headerTintColor: colors.accent,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: "KeepLink" }} />
    </Stack>
  );
}
