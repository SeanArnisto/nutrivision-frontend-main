import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NumericInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  minValue?: number;
  maxValue?: number;
  onValidationChange?: (isValid: boolean, errorMessage?: string) => void;
  unit?: string; // 'cm', 'kg', 'years', etc.
}

export default function NumericInput({
  value,
  onChangeText,
  placeholder = "Enter value",
  minValue = 0,
  maxValue = 999,
  onValidationChange,
  unit = "",
}: NumericInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const validateValue = (text: string) => {
    const numericValue = parseFloat(text);
    
    if (!text || isNaN(numericValue)) {
      onValidationChange?.(false, `Please enter a valid ${unit || 'value'}`);
      return;
    }
    
    if (numericValue < minValue || numericValue > maxValue) {
      onValidationChange?.(
        false, 
        `${unit ? unit.charAt(0).toUpperCase() + unit.slice(1) : 'Value'} must be between ${minValue}-${maxValue}${unit ? ` ${unit}` : ''}`
      );
      return;
    }
    
    onValidationChange?.(true);
  };

  const handleChangeText = (text: string) => {
    // Only allow numbers and decimal point
    const filteredText = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const decimalCount = (filteredText.match(/\./g) || []).length;
    if (decimalCount > 1) return;
    
    onChangeText(filteredText);
    // Remove real-time validation to prevent toast resets
  };

  const handleEditPress = () => {
    // Visual feedback for edit action
    // Actual focus is handled by user interaction with input
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
      ]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType="decimal-pad"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          returnKeyType="done"
        />
        
        <TouchableOpacity onPress={handleEditPress} style={styles.editButton}>
          <Ionicons name="pencil" size={20} color="#9AB106" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
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
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
    fontFamily: 'AlbertSans-Regular',
  },
  editButton: {
    padding: 12,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(154, 177, 6, 0.1)',
  },
});