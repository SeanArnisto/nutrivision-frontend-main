import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NavItem {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

interface BottomNavBarProps {
  activeTab: string;
  onTabPress: (tabName: string) => void;
}

export default function BottomNavBar({ 
  activeTab, 
  onTabPress
}: BottomNavBarProps) {
  const insets = useSafeAreaInsets();

  const navItems: NavItem[] = [
    {
      name: 'home',
      icon: 'home',
      onPress: () => onTabPress('home')
    },
    {
      name: 'stats',
      icon: 'bar-chart',
      onPress: () => onTabPress('stats')
    },
    {
      name: 'settings',
      icon: 'settings',
      onPress: () => onTabPress('settings')
    },
    {
      name: 'profile',
      icon: 'person',
      onPress: () => onTabPress('profile')
    }
  ];

  return (
    <View style={styles.container}>
      {/* Camera button positioned above the navbar */}
      <TouchableOpacity
        style={styles.cameraButtonContainer}
        onPress={() => onTabPress('camera')}
      >
        <View style={styles.cameraButtonInner}>
          <Ionicons name="add" size={32} color="#fff" />
        </View>
      </TouchableOpacity>

      <View style={[styles.navbar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {/* First two tabs */}
        {navItems.slice(0, 2).map((item) => (
          <TouchableOpacity
            key={item.name}
            style={styles.tabItem}
            onPress={item.onPress}
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
            onPress={item.onPress}
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
    width: 56, // Updated to match new button size
  },
  cameraButtonContainer: {
    position: 'absolute',
    top: -28, // Updated for larger button
    left: '50%',
    marginLeft: -28, // Updated for larger button
    zIndex: 101,
  },
  cameraButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#9AB106',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9AB106',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});