// BottomNavBar.tsx
import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useNavigationState, useFocusEffect } from '@react-navigation/native';

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
  routeMapping = {}
}: BottomNavBarProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('home');

  // Default route mapping - can be overridden via props
  const defaultRouteMapping: { [key: string]: string } = {
    'home': 'home',
    'stats': 'stats',
    'settings': 'settings',
    'profile': 'profile',
    'camera': 'camera',
    ...routeMapping
  };

  // Reverse mapping for route name to tab name
  const reverseRouteMapping = Object.entries(defaultRouteMapping).reduce((acc, [tab, route]) => {
    acc[route.toLowerCase()] = tab;
    return acc;
  }, {} as { [key: string]: string });

  const navItems: NavItem[] = [
    {
      name: 'home',
      icon: 'home',
      routeName: defaultRouteMapping.home
    },
    {
      name: 'stats',
      icon: 'bar-chart',
      routeName: defaultRouteMapping.stats
    },
    {
      name: 'settings',
      icon: 'settings',
      routeName: defaultRouteMapping.settings
    },
    {
      name: 'profile',
      icon: 'person',
      routeName: defaultRouteMapping.profile
    }
  ];

  // Get current route name
  const currentRouteName = useNavigationState(state => {
    if (!state || state.routes.length === 0) return null;
    return state.routes[state.index]?.name?.toLowerCase();
  });

  // Update active tab when route changes (handles swipe navigation)
  useEffect(() => {
    if (currentRouteName) {
      const tabName = reverseRouteMapping[currentRouteName] || currentRouteName;
      setActiveTab(tabName);
    }
  }, [currentRouteName]);

  // Alternative method using focus effect (more reliable for some navigation setups)
  useFocusEffect(
    React.useCallback(() => {
      if (currentRouteName) {
        const tabName = reverseRouteMapping[currentRouteName] || currentRouteName;
        setActiveTab(tabName);
      }
    }, [currentRouteName])
  );

  // Handle tab press
  const handleTabPress = (tabName: string) => {
    try {
      const routeName = defaultRouteMapping[tabName] || tabName;
      setActiveTab(tabName);
      
      // Navigate to the route
      if (navigation && typeof navigation.navigate === 'function') {
        navigation.navigate(routeName as never);
      }
    } catch (error) {
      console.warn('Navigation error:', error);
    }
  };

  // Handle camera press
  const handleCameraPress = () => {
    if (onCameraPress) {
      onCameraPress();
    } else {
      handleTabPress('camera');
    }
  };

  return (
    <View style={styles.container}>
      {/* Camera button positioned above the navbar */}
      <TouchableOpacity
        style={styles.cameraButtonContainer}
        onPress={handleCameraPress}
      >
        <View style={styles.cameraButtonInner}>
          <Ionicons name="camera" size={32} color="#fff" />
        </View>
      </TouchableOpacity>

      <View style={[styles.navbar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {/* First two tabs */}
        {navItems.slice(0, 2).map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.tabItem}
            onPress={() => handleTabPress(item.name)}
          >
            <Ionicons
              name={item.icon}
              size={28}
              color={activeTab === item.name ? '#9AB106' : '#8E8E93'}
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
          >
            <Ionicons
              name={item.icon}
              size={28}
              color={activeTab === item.name ? '#9AB106' : '#8E8E93'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000',
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
    alignItems: 'center',
    paddingVertical: 8,
  },
  cameraSpace: {
    width: 56,
  },
  cameraButtonContainer: {
    position: 'absolute',
    top: -28,
    left: '50%',
    marginLeft: -28,
    zIndex: 101,
  },
  cameraButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#9AB106',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/* 
Usage Examples:

// Basic usage (no changes needed in parent components):
<BottomNavBar />

// With custom camera handler:
<BottomNavBar 
  onCameraPress={() => console.log('Custom camera action')} 
/>

// With custom route mapping (if your route names are different):
<BottomNavBar 
  routeMapping={{
    home: 'HomeScreen',
    stats: 'StatisticsScreen',
    settings: 'SettingsScreen',
    profile: 'ProfileScreen'
  }}
/>
*/