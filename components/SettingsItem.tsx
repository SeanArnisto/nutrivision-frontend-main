import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SettingsItemProps {
  title: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightComponent?: React.ReactNode;
  style?: object;
}

export default function SettingsItem({
  title,
  onPress,
  showChevron = true,
  rightComponent,
  style,
}: SettingsItemProps) {
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component style={[styles.container, style]} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.rightSection}>
        {rightComponent}
        {showChevron && onPress && (
          <Ionicons name="chevron-forward" size={20} color="#666" />
        )}
      </View>
    </Component>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'AlbertSans-Medium',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
