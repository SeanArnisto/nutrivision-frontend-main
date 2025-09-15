// BottomNavBar.tsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";

interface NavItem {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  routeName: string;
}

interface BottomNavBarProps {
  onCameraPress?: () => void;
  // Optional prop to override default route mapping
  routeMapping?: { [key: string]: string };
}

export default function BottomNavBar({
  onCameraPress,
  routeMapping = {},
}: BottomNavBarProps) {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("home");

  // Memoize route mapping to prevent recalculation
  const defaultRouteMapping = useMemo<Record<string, string>>(
    () => ({
      home: "home",
      stats: "stats",
      settings: "settings",
      profile: "profile",
      camera: "camera",
      ...routeMapping,
    }),
    [routeMapping]
  );

  // Memoize reverse mapping
  const reverseRouteMapping = useMemo(() => {
    return Object.entries(defaultRouteMapping).reduce(
      (acc, [tab, routeName]) => {
        acc[routeName.toLowerCase()] = tab;
        return acc;
      },
      {} as { [key: string]: string }
    );
  }, [defaultRouteMapping]);

  // Memoize nav items
  const navItems: NavItem[] = useMemo(
    () => [
      {
        name: "home",
        icon: "home",
        routeName: defaultRouteMapping.home,
      },
      {
        name: "stats",
        icon: "bar-chart",
        routeName: defaultRouteMapping.stats,
      },
      {
        name: "settings",
        icon: "settings",
        routeName: defaultRouteMapping.settings,
      },
      {
        name: "profile",
        icon: "person",
        routeName: defaultRouteMapping.profile,
      },
    ],
    [defaultRouteMapping]
  );

  // Update active tab based on current route - use route.name for immediate updates
  const updateActiveTab = useCallback(() => {
    const currentRouteName = route.name?.toLowerCase();
    if (currentRouteName) {
      const tabName = reverseRouteMapping[currentRouteName] || currentRouteName;
      setActiveTab(tabName);
    }
  }, [route.name, reverseRouteMapping]);

  // Use useFocusEffect for immediate updates when route changes
  useFocusEffect(updateActiveTab);

  // Also update on mount and when route changes
  useEffect(() => {
    updateActiveTab();
  }, [updateActiveTab]);

  // Handle tab press
  const handleTabPress = useCallback(
    (tabName: string) => {
      try {
        const routeName = defaultRouteMapping[tabName] || tabName;

        // Optimistically update the active tab for immediate visual feedback
        setActiveTab(tabName);

        // Navigate to the route
        if (navigation && typeof navigation.navigate === "function") {
          navigation.navigate(routeName as never);
        }
      } catch (error) {
        console.warn("Navigation error:", error);
        // Revert optimistic update on error
        updateActiveTab();
      }
    },
    [defaultRouteMapping, navigation, updateActiveTab]
  );

  // Handle camera press
  const handleCameraPress = useCallback(() => {
    if (onCameraPress) {
      onCameraPress();
    } else {
      handleTabPress("camera");
    }
  }, [onCameraPress, handleTabPress]);

  return (
    <View style={styles.container}>
      {/* Camera button positioned above the navbar */}
      <TouchableOpacity
        style={styles.cameraButtonContainer}
        onPress={handleCameraPress}
        activeOpacity={0.8}
      >
        <View style={styles.cameraButtonInner}>
          <Ionicons name="camera" size={32} color="#fff" />
        </View>
      </TouchableOpacity>

      <View
        style={[styles.navbar, { paddingBottom: Math.max(insets.bottom, 12) }]}
      >
        {/* First two tabs */}
        {navItems.slice(0, 2).map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.tabItem}
            onPress={() => handleTabPress(item.name)}
            activeOpacity={0.6}
          >
            <Ionicons
              name={item.icon}
              size={28}
              color={activeTab === item.name ? "#9AB106" : "#8E8E93"}
            />
          </TouchableOpacity>
        ))}

        {/* Empty space for camera button */}
        <View style={styles.cameraSpace} />

        {/* Last two tabs */}
        {navItems.slice(2, 4).map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.tabItem}
            onPress={() => handleTabPress(item.name)}
            activeOpacity={0.6}
          >
            <Ionicons
              name={item.icon}
              size={28}
              color={activeTab === item.name ? "#9AB106" : "#8E8E93"}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  navbar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingTop: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  cameraSpace: {
    width: 56,
  },
  cameraButtonContainer: {
    position: "absolute",
    top: -28,
    left: "50%",
    marginLeft: -28,
    zIndex: 101,
  },
  cameraButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#9AB106",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
