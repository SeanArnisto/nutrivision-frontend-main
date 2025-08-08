import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FloatingActionButtonProps {
  onPress: () => void;
}

export default function FloatingActionButton({ onPress }: FloatingActionButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Ionicons name="add" size={30} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 80, // Above bottom nav
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#9AB106',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
