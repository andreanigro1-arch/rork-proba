import { Stack } from "expo-router";

export default function WorkoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      <Stack.Screen name="start" />
      <Stack.Screen name="active" />
      <Stack.Screen name="add-exercise" options={{ presentation: "modal" }} />
      <Stack.Screen name="timer" options={{ presentation: "modal" }} />
      <Stack.Screen name="plates" options={{ presentation: "modal" }} />
    </Stack>
  );
}
