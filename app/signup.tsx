import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/types';

import ScreenContainer from '@/components/ScreenContainer';
import CustomTextInput from '@/components/CustomTextInput';
import AuthButton from '@/components/AuthButton';
import SocialButton from '@/components/SocialButton';
import LinkButton from '@/components/LinkButton';

type SignUpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'signup'>;

interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignUpErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive scaling functions
const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 812) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export default function SignUpScreen() {
  const navigation = useNavigation<SignUpScreenNavigationProp>();

  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<SignUpErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: SignUpErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Navigate to main app or email verification
      navigation.navigate('page-2'); // Replace with your main screen
    } catch (error) {
      setErrors({ general: 'Sign up failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    console.log('Google sign up pressed');
  };

  const handleFacebookSignUp = () => {
    console.log('Facebook sign up pressed');
  };

  const handleLoginNavigation = () => {
    navigation.navigate('login');
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Container */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/nutrivision_headstarted.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title Container */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Sign up</Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <CustomTextInput
              label="Email"
              value={formData.email}
              onChangeText={(email) => setFormData(prev => ({ ...prev, email }))}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoComplete="email"
              error={errors.email}
            />

            <CustomTextInput
              label="Password"
              value={formData.password}
              onChangeText={(password) => setFormData(prev => ({ ...prev, password }))}
              placeholder="Enter your password"
              secureTextEntry
              autoComplete="password"
              error={errors.password}
            />

            <CustomTextInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(confirmPassword) => setFormData(prev => ({ ...prev, confirmPassword }))}
              placeholder="Confirm your password"
              secureTextEntry
              autoComplete="password"
              error={errors.confirmPassword}
            />

            {/* General Error Container */}
            <View style={styles.generalErrorContainer}>
              <Text style={[styles.generalError, !errors.general && styles.generalErrorHidden]}>
                {errors.general || ' '}
              </Text>
            </View>

            {/* Sign Up Button Container */}
            <View style={styles.signUpButtonContainer}>
              <AuthButton
                title="SIGN UP"
                onPress={handleSignUp}
                disabled={!formData.email || !formData.password || !formData.confirmPassword}
                loading={isLoading}
              />
            </View>
          </View>

          {/* Divider Container */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Sign Up Container */}
          <View style={styles.socialContainer}>
            <SocialButton
              provider="google"
              onPress={handleGoogleSignUp}
              disabled={isLoading}
            />

            <SocialButton
              provider="facebook"
              onPress={handleFacebookSignUp}
              disabled={isLoading}
            />
          </View>

          {/* Bottom Divider Container */}
          <View style={styles.bottomDividerContainer}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerLine} />
          </View>

          {/* Login Link Container */}
          <View style={styles.loginLinkContainer}>
            <LinkButton
              title="Already have an account? Log in"
              onPress={handleLoginNavigation}
              color="#333"
              size="large"
              underline
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(5),
    paddingBottom: verticalScale(5),
  },
  logoContainer: {
    alignItems: 'center',
    minHeight: verticalScale(50),
    justifyContent: 'center',
    marginBottom: verticalScale(5),
    paddingVertical: verticalScale(2),
  },
  logo: {
    width: scale(220),
    height: verticalScale(50),
    maxWidth: screenWidth * 0.6,
    maxHeight: verticalScale(60),
  },
  titleContainer: {
    minHeight: verticalScale(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(10),
    paddingVertical: verticalScale(2),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#333',
    lineHeight: moderateScale(30),
  },
  formContainer: {
    marginBottom: verticalScale(5),
  },
  generalErrorContainer: {
    minHeight: verticalScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(12),
    paddingHorizontal: scale(10),
  },
  generalError: {
    fontSize: scale(14),
    color: '#F44336',
    textAlign: 'center',
    lineHeight: scale(18),
    flexWrap: 'wrap',
  },
  generalErrorHidden: {
    opacity: 0,
  },
  signUpButtonContainer: {
    minHeight: verticalScale(44),
    marginBottom: verticalScale(5),
    paddingVertical: verticalScale(1),
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: verticalScale(30),
    marginVertical: verticalScale(5),
    paddingVertical: verticalScale(2),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: scale(5),
  },
  dividerText: {
    fontSize: scale(16),
    fontWeight: 'normal',
    color: '#666',
    marginHorizontal: scale(16),
    lineHeight: scale(20),
  },
  socialContainer: {
    minHeight: verticalScale(90),
    justifyContent: 'space-between',
    marginBottom: verticalScale(5),
    paddingVertical: verticalScale(2),
  },
  bottomDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: verticalScale(15),
    marginVertical: verticalScale(5),
  },
  loginLinkContainer: {
    minHeight: verticalScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(5),
    paddingVertical: verticalScale(2),
  },
});