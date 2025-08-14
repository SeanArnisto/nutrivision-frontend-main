import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@/types/types';

import ScreenContainer from '@/components/ScreenContainer';
import CustomTextInput from '@/components/CustomTextInput';
import AuthButton from '@/components/AuthButton';

type ForgotPasswordResetNavigationProp = StackNavigationProp<RootStackParamList, 'forgot-reset'>;

interface RouteParams {
  email?: string;
}

interface PasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

interface PasswordErrors {
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 812) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export default function ForgotPasswordResetScreen() {
  const navigation = useNavigation<ForgotPasswordResetNavigationProp>();
  const route = useRoute();
  const { email } = (route.params as RouteParams) || {};

  const [formData, setFormData] = useState<PasswordFormData>({
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<PasswordErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Password validation checks
  const hasMinLength = formData.newPassword.length >= 8;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword);

  const validateForm = (): boolean => {
    const newErrors: PasswordErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!hasSpecialChar) {
      newErrors.newPassword = 'Password must contain one special character';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Simulate API call to reset password
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate back to login
      navigation.navigate('login');
    } catch (error) {
      setErrors({ general: 'Failed to reset password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <ScreenContainer>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Ionicons name="chevron-back" size={scale(24)} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Forgot Password</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Lock Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.lockIcon}>
                <Ionicons name="lock-closed" size={scale(40)} color="#9AB106" />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>Set New Password</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              your new password must be different{'\n'}to previously used Passwords.
            </Text>

            {/* Form */}
            <View style={styles.formContainer}>
              <CustomTextInput
                label="New Password*"
                value={formData.newPassword}
                onChangeText={(newPassword) => setFormData(prev => ({ ...prev, newPassword }))}
                placeholder="Enter your new password"
                secureTextEntry
                error={errors.newPassword}
              />

              <CustomTextInput
                label="Confirm Password*"
                value={formData.confirmPassword}
                onChangeText={(confirmPassword) => setFormData(prev => ({ ...prev, confirmPassword }))}
                placeholder="Confirm your password"
                secureTextEntry
                error={errors.confirmPassword}
              />

              {/* Password Requirements */}
              <View style={styles.requirementsContainer}>
                <View style={styles.requirementItem}>
                  <Ionicons 
                    name={hasMinLength ? "checkmark-circle" : "checkmark-circle-outline"} 
                    size={scale(16)} 
                    color={hasMinLength ? "#4CAF50" : "#E0E0E0"} 
                  />
                  <Text style={[styles.requirementText, hasMinLength && styles.requirementMet]}>
                    Must be at least 8 characters
                  </Text>
                </View>

                <View style={styles.requirementItem}>
                  <Ionicons 
                    name={hasSpecialChar ? "checkmark-circle" : "checkmark-circle-outline"} 
                    size={scale(16)} 
                    color={hasSpecialChar ? "#4CAF50" : "#E0E0E0"} 
                  />
                  <Text style={[styles.requirementText, hasSpecialChar && styles.requirementMet]}>
                    Must contain one special character
                  </Text>
                </View>
              </View>

              {/* General Error */}
              <View style={styles.generalErrorContainer}>
                <Text style={[styles.generalError, !errors.general && styles.generalErrorHidden]}>
                  {errors.general || ' '}
                </Text>
              </View>

              {/* Submit Button */}
              <View style={styles.submitButtonContainer}>
                <AuthButton
                  title="SUBMIT"
                  onPress={handleSubmit}
                  disabled={!formData.newPassword || !formData.confirmPassword}
                  loading={isLoading}
                />
              </View>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    paddingTop: verticalScale(10),
  },
  backButton: {
    padding: scale(5),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#333',
  },
  headerPlaceholder: {
    width: scale(34),
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: verticalScale(20),
  },
  lockIcon: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: '#F0F8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: verticalScale(10),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: scale(16),
    color: '#666',
    textAlign: 'center',
    marginBottom: verticalScale(25),
    lineHeight: scale(22),
  },
  formContainer: {
    width: '100%',
  },
  requirementsContainer: {
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  requirementText: {
    fontSize: scale(14),
    color: '#666',
    marginLeft: scale(8),
  },
  requirementMet: {
    color: '#4CAF50',
  },
  generalErrorContainer: {
    minHeight: verticalScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  generalError: {
    fontSize: scale(14),
    color: '#F44336',
    textAlign: 'center',
  },
  generalErrorHidden: {
    opacity: 0,
  },
  submitButtonContainer: {
    width: '100%',
    paddingHorizontal: scale(10),
  },
});