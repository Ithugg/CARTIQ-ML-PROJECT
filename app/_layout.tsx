import { Stack, useRouter, useSegments } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../stores/authStore";
import { useListsStore } from "../stores/listsStore";
import { usePurchaseStore } from "../stores/purchaseStore";
import { usePredictionsStore } from "../stores/predictionsStore";
import { Colors } from "../constants/theme";

// Error boundary to catch and DISPLAY crashes on phone
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: "#1a1a2e", padding: 40, paddingTop: 80 }}>
          <Text style={{ color: "#e94560", fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>
            CartIQ Crash Report
          </Text>
          <Text style={{ color: "#fff", fontSize: 14, marginBottom: 8 }}>
            {this.state.error?.message}
          </Text>
          <Text style={{ color: "#aaa", fontSize: 11 }}>
            {this.state.error?.stack}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initialize = useAuthStore((s) => s.initialize);
  const subscribeLists = useListsStore((s) => s.subscribe);
  const subscribePurchases = usePurchaseStore((s) => s.subscribe);
  const purchases = usePurchaseStore((s) => s.purchases);
  const compute = usePredictionsStore((s) => s.compute);
  const segments = useSegments();
  const router = useRouter();
  const [isNavReady, setIsNavReady] = useState(false);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, []);

  // Subscribe to Firestore data when user is authenticated
  useEffect(() => {
    if (!user) return;

    const unsubLists = subscribeLists(user.uid);
    const unsubPurchases = subscribePurchases(user.uid);

    return () => {
      unsubLists();
      unsubPurchases();
    };
  }, [user?.uid]);

  // Recompute predictions when purchases change
  useEffect(() => {
    if (purchases.length > 0) {
      compute(purchases);
    }
  }, [purchases]);

  // Delay navigation until layout is mounted
  useEffect(() => {
    const timer = setTimeout(() => setIsNavReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Navigation guard
  useEffect(() => {
    if (isLoading || !isNavReady || !isInitialized) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      // After login/signup, check if onboarding is needed
      if (!user.onboardingComplete) {
        router.replace("/onboarding");
      } else {
        router.replace("/(app)/dashboard");
      }
    } else if (user && inOnboarding && user.onboardingComplete) {
      // Already finished onboarding, go to dashboard
      router.replace("/(app)/dashboard");
    }
  }, [user, segments, isLoading, isNavReady, isInitialized]);

  // Show loading spinner while auth initializes
  if (isLoading || !isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.neutral[0] }}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <StatusBar style="dark" />
        <AuthGate>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
          </Stack>
        </AuthGate>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
