import React from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';

interface ScreenContainerProps {
  children: React.ReactNode;
  backgroundColor?: string;
  showHeader?: boolean;
  headerProps?: any;
}

export default function ScreenContainer({
  children,
  backgroundColor = '#eff1f6',
  showHeader = false,
  headerProps,
}: ScreenContainerProps) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});