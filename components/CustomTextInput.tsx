import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomTextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'name' | 'off';
  error?: string;
  showForgotPassword?: boolean;
  onForgotPasswordPress?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive scaling based on screen size
const scale = (size: number) => (screenWidth / 375) * size; // Base on iPhone X width
const verticalScale = (size: number) => (screenHeight / 812) * size; // Base on iPhone X height

export default function CustomTextInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  error,
  showForgotPassword = false,
  onForgotPasswordPress,
}: CustomTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={styles.container}>
      {/* Label container with forgot password for password fields */}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {showForgotPassword && (
          <TouchableOpacity onPress={onForgotPasswordPress}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Input container with responsive min-height */}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
      ]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        
        {secureTextEntry && (
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeButton}>
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={scale(20)}
              color="#666"
            />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Error container with reserved space that maintains proportions */}
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, !error && styles.errorTextHidden]}>
          {error || ' '}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: verticalScale(8), // Reduced from 16
    minHeight: verticalScale(70), // Reduced from 90
  },
  labelContainer: {
    minHeight: verticalScale(18),
    paddingVertical: verticalScale(1),
    marginBottom: verticalScale(3),
    flexDirection: 'row', // Added for forgot password layout
    justifyContent: 'space-between', // Added for forgot password layout
    alignItems: 'center', // Added for forgot password layout
  },
  label: {
    fontSize: scale(16),
    fontWeight: '500',
    color: '#333',
    lineHeight: scale(20), // Consistent line height
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    minHeight: verticalScale(48), // Responsive min-height
    paddingVertical: verticalScale(4), // Small padding for flexibility
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: '#9AB106',
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: '#F44336',
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontSize: scale(16),
    color: '#333',
    lineHeight: scale(20), // Consistent line height
    paddingVertical: verticalScale(8), // Flexible padding
    minHeight: verticalScale(24), // Ensure text has space
  },
  eyeButton: {
    padding: scale(8),
    minWidth: scale(36), // Responsive min-width
    minHeight: scale(36), // Responsive min-height
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    minHeight: verticalScale(16), // Reduced from 22
    justifyContent: 'flex-start',
    paddingTop: verticalScale(2), // Reduced from 4
    paddingHorizontal: scale(2),
  },
  errorText: {
    fontSize: scale(14),
    color: '#F44336',
    lineHeight: scale(18),
    flexWrap: 'wrap', // Allow text wrapping on smaller screens
  },
  errorTextHidden: {
    opacity: 0, // Hide but maintain space
  },
  forgotPasswordText: {
    fontSize: scale(14),
    color: '#9AB106',
    fontWeight: '500',
  },
});