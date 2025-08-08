import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileFieldProps {
  label: string;
  value: string;
  onPress?: () => void;
  editable?: boolean;
  style?: object;
}

export default function ProfileField({
  label,
  value,
  onPress,
  editable = true,
  style,
}: ProfileFieldProps) {
  const Component = editable && onPress ? TouchableOpacity : View;

  return (
    <Component style={[styles.container, style]} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      
      {editable && onPress && (
        <Ionicons name="chevron-forward" size={20} color="#666" />
      )}
    </Component>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'AlbertSans-Bold',
  },
  value: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'AlbertSans-Regular',
  },
});
