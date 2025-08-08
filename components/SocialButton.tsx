import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type SocialProvider = 'google' | 'facebook' | 'apple';

interface SocialButtonProps {
  provider: SocialProvider;
  onPress: () => void;
  disabled?: boolean;
}

export default function SocialButton({ provider, onPress, disabled = false }: SocialButtonProps) {
  const getProviderConfig = () => {
    switch (provider) {
      case 'google':
        return {
          text: 'Continue with Google',
          icon: 'logo-google' as const,
          iconColor: '#4285F4',
          backgroundColor: 'transparent',
          textColor: '#333',
          borderColor: '#E0E0E0',
        };
      case 'facebook':
        return {
          text: 'Continue with Facebook',
          icon: 'logo-facebook' as const,
          iconColor: '#1877F2',
          backgroundColor: 'transparent',
          textColor: '#333',
          borderColor: '#E0E0E0',
        };
      case 'apple':
        return {
          text: 'Continue with Apple',
          icon: 'logo-apple' as const,
          iconColor: '#000',
          backgroundColor: '#000',
          textColor: '#fff',
          borderColor: '#000',
        };
      default:
        return {
          text: 'Continue',
          icon: 'log-in' as const,
          iconColor: '#333',
          backgroundColor: '#fff',
          textColor: '#333',
          borderColor: '#E0E0E0',
        };
    }
  };

  const config = getProviderConfig();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.content}>
        <Ionicons
          name={config.icon}
          size={20}
          color={config.iconColor}
          style={styles.icon}
        />
        <Text style={[styles.text, { color: config.textColor }]}>
          {config.text}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.6,
  },
});