import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface LinkButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  underline?: boolean;
  disabled?: boolean;
}

export default function LinkButton({
  title,
  onPress,
  color = '#9AB106',
  size = 'medium',
  underline = false,
  disabled = false,
}: LinkButtonProps) {
  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'medium':
        return 16;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text
        style={[
          styles.text,
          {
            color: disabled ? '#999' : color,
            fontSize: getFontSize(),
            textDecorationLine: underline ? 'underline' : 'none',
          },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
});