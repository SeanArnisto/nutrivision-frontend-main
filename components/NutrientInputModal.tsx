import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface NutrientValues {
  avgCarbs: string;
  avgSodium: string;
  avgProtein: string;
  avgCalories: string;
}

interface NutrientInputModalProps {
  visible: boolean;
  title: string;
  initialValues: NutrientValues;
  onSubmit: (values: NutrientValues) => void;
  onCancel: () => void;
}

const NutrientInputModal: React.FC<NutrientInputModalProps> = ({
  visible,
  title,
  initialValues,
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<NutrientValues>(initialValues);
  const [errors, setErrors] = useState<Partial<NutrientValues>>({});

  useEffect(() => {
    if (visible) {
      setValues(initialValues);
      setErrors({});
    }
  }, [visible, initialValues]);

  // ✅ Enhanced validation: Only numbers, no characters, must be > 0
  const validateNumber = (value: string): boolean => {
    // Check if empty
    if (!value || value.trim() === '') {
      return false;
    }

    // Check if contains only digits and optional decimal point
    const numberRegex = /^\d*\.?\d*$/;
    if (!numberRegex.test(value)) {
      return false;
    }

    // Parse and check if >= 0
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return false;
    }

    return true;
  };

  // ✅ Filter input to allow only numbers and decimal point
  const sanitizeInput = (text: string): string => {
    // Remove any non-numeric characters except decimal point
    return text.replace(/[^0-9.]/g, '');
  };

  const handleChange = (field: keyof NutrientValues, value: string) => {
    // Sanitize input first
    const sanitized = sanitizeInput(value);
    
    setValues(prev => ({ ...prev, [field]: sanitized }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = () => {
    const newErrors: Partial<NutrientValues> = {};

    // Validate carbohydrates
    if (!validateNumber(values.avgCarbs)) {
      newErrors.avgCarbs = 'Please enter a valid number (must be greater than 0)';
    } else if (parseFloat(values.avgCarbs) === 0) {
      newErrors.avgCarbs = 'Value must be greater than 0';
    }

    // Validate protein
    if (!validateNumber(values.avgProtein)) {
      newErrors.avgProtein = 'Please enter a valid number (must be greater than 0)';
    } else if (parseFloat(values.avgProtein) === 0) {
      newErrors.avgProtein = 'Value must be greater than 0';
    }

    // Validate sodium
    if (!validateNumber(values.avgSodium)) {
      newErrors.avgSodium = 'Please enter a valid number (must be greater than 0)';
    } else if (parseFloat(values.avgSodium) === 0) {
      newErrors.avgSodium = 'Value must be greater than 0';
    }

    // Validate calories
    if (!validateNumber(values.avgCalories)) {
      newErrors.avgCalories = 'Please enter a valid number (must be greater than 0)';
    } else if (parseFloat(values.avgCalories) === 0) {
      newErrors.avgCalories = 'Value must be greater than 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(values);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{title}</Text>

          <ScrollView style={styles.scrollView}>
            {/* Input fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Calories (kcal/day)</Text>
              <TextInput
                style={[styles.input, errors.avgCalories && styles.inputError]}
                placeholder="e.g., 2000"
                keyboardType="decimal-pad"
                value={values.avgCalories}
                onChangeText={(text) => handleChange('avgCalories', text)}
                placeholderTextColor="#999"
              />
              {errors.avgCalories && (
                <Text style={styles.errorText}>{errors.avgCalories}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Carbohydrates (grams/day)</Text>
              <TextInput
                style={[styles.input, errors.avgCarbs && styles.inputError]}
                placeholder="e.g., 300"
                keyboardType="decimal-pad"
                value={values.avgCarbs}
                onChangeText={(text) => handleChange('avgCarbs', text)}
                placeholderTextColor="#999"
              />
              {errors.avgCarbs && (
                <Text style={styles.errorText}>{errors.avgCarbs}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Protein (grams/day)</Text>
              <TextInput
                style={[styles.input, errors.avgProtein && styles.inputError]}
                placeholder="e.g., 50"
                keyboardType="decimal-pad"
                value={values.avgProtein}
                onChangeText={(text) => handleChange('avgProtein', text)}
                placeholderTextColor="#999"
              />
              {errors.avgProtein && (
                <Text style={styles.errorText}>{errors.avgProtein}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sodium (milligrams/day)</Text>
              <TextInput
                style={[styles.input, errors.avgSodium && styles.inputError]}
                placeholder="e.g., 2300"
                keyboardType="decimal-pad"
                value={values.avgSodium}
                onChangeText={(text) => handleChange('avgSodium', text)}
                placeholderTextColor="#999"
              />
              {errors.avgSodium && (
                <Text style={styles.errorText}>{errors.avgSodium}</Text>
              )}
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              activeOpacity={0.7}
            >
              <Text style={styles.submitButtonText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 24,
    ...Platform.select({
      android: {
        elevation: 5,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'android' ? '700' : 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  scrollView: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#f44336',
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    fontSize: 13,
    color: '#f44336',
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 24,
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#9AB106',
    paddingVertical: Platform.OS === 'android' ? 16 : 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Platform.OS === 'android' ? 48 : 'auto',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: Platform.OS === 'android' ? '700' : 'bold',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: Platform.OS === 'android' ? 14 : 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Platform.OS === 'android' ? 48 : 'auto',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: Platform.OS === 'android' ? '600' : '500',
  },
});

export default NutrientInputModal;