import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface SelectionButtonProps {
  title: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: object;
  textStyle?: object;
}

export default function SelectionButton({
  title,
  selected,
  onPress,
  disabled = false,
  style,
  textStyle,
}: SelectionButtonProps) {
  const buttonStyle = selected ? styles.selectedButton : styles.unselectedButton;
  const buttonTextStyle = selected ? styles.selectedText : styles.unselectedText;

  return (
    <TouchableOpacity
      style={[buttonStyle, style, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[buttonTextStyle, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  selectedButton: {
    width: '90%',
    padding: 16,
    backgroundColor: '#9AB106',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unselectedButton: {
    width: '90%',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'AlbertSans-SemiBold',
  },
  unselectedText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'AlbertSans-Medium',
  },
  disabled: {
    opacity: 0.6,
  },
});