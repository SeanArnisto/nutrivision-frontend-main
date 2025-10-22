import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: object;
  textStyle?: object;
  variant?: 'primary' | 'secondary';
}

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  variant = 'primary',
}: PrimaryButtonProps) {
  const buttonStyle = variant === 'primary' ? styles.primaryButton : styles.secondaryButton;
  const buttonTextStyle = variant === 'primary' ? styles.primaryText : styles.secondaryText;

  return (
    <TouchableOpacity
      style={[
        buttonStyle,
        style,
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? '#fff' : '#9AB106'} 
          size="small" 
        />
      ) : (
        <Text style={[buttonTextStyle, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    width: '90%',
    padding: 16,
    backgroundColor: '#9AB106',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  secondaryButton: {
    width: '90%',
    padding: 16,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#9AB106',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'AlbertSans-Bold',
  },
  secondaryText: {
    color: '#9AB106',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'AlbertSans-Bold',
  },
  disabled: {
    opacity: 0.6,
  },
});