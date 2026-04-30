import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet } from "react-native";

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#FFFFFF" },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="workout" />
        <Stack.Screen name="exercise/[id]" options={{ presentation: "card" }} />
        <Stack.Screen name="settings" options={{ presentation: "modal" }} />
        <Stack.Screen name="routine-builder" options={{ presentation: "card" }} />
        <Stack.Screen name="workout-detail/[id]" options={{ presentation: "card" }} />
      </Stack>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
