import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  style?: object;
}

export default function SettingsSection({
  title,
  children,
  style,
}: SettingsSectionProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 24,
    marginBottom: 12,
    fontFamily: 'AlbertSans-Bold',
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
});
