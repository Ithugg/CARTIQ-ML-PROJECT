import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, View } from "react-native";
import { Colors } from "../../constants/theme";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary[600],
        tabBarInactiveTintColor: Colors.neutral[400],
        tabBarStyle: {
          backgroundColor: Colors.neutral[0],
          borderTopWidth: 0,
          paddingBottom: Platform.OS === "ios" ? 24 : 8,
          paddingTop: 10,
          height: Platform.OS === "ios" ? 88 : 64,
          // Premium shadow
          shadowColor: Colors.neutral[900],
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: "Lists",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons name={focused ? "list" : "list-outline"} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="predictions"
        options={{
          title: "Predict",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons name={focused ? "sparkles" : "sparkles-outline"} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? { transform: [{ scale: 1.1 }] } : undefined}>
              <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
            </View>
          ),
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="listdetail" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="additem" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="sharelist" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="generate" options={{ href: null }} />
      <Tabs.Screen name="pantry" options={{ href: null, tabBarStyle: { display: "none" } }} />
    </Tabs>
  );
}
