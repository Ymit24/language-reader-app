import { Stack } from "expo-router";

export default function LibraryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="new/index"
        options={{
          presentation: "modal",
        }}
      />
      <Stack.Screen name="[lessonId]/index" />
    </Stack>
  );
}
