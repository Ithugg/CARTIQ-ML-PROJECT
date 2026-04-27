import { Redirect } from "expo-router";

export default function Index() {
  // The AuthGuard in _layout.tsx will handle proper routing
  // This just ensures there's an entry point for Expo Router
  return <Redirect href="/(auth)/login" />;
}
