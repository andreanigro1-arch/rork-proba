import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet } from "react-native";

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,           // ukrywa górny pasek na większości ekranów
          contentStyle: { backgroundColor: "#FFFFFF" },
        }}
      >
        {/* Główna nawigacja z tabami na dole */}
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }} 
        />

        {/* Dodatkowe ekrany poza tabami */}
        <Stack.Screen name="workout" options={{ headerShown: false }} />
        <Stack.Screen name="exercise/[id]" options={{ presentation: "card" }} />
        <Stack.Screen name="workout-detail/[id]" options={{ presentation: "card" }} />
        <Stack.Screen name="routine-builder" options={{ presentation: "modal" }} />
        <Stack.Screen name="settings" options={{ presentation: "modal" }} />
        <Stack.Screen name="create-exercise" options={{ presentation: "modal" }} />
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
