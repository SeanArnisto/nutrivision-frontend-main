import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@/types/types';

import ScreenContainer from '@/components/ScreenContainer';
import AuthButton from '@/components/AuthButton';

type EmailVerificationNavigationProp = StackNavigationProp<RootStackParamList, 'otp'>;

interface RouteParams {
  email?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 812) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export default function EmailVerificationScreen() {
  const navigation = useNavigation<EmailVerificationNavigationProp>();
  const route = useRoute();
  const { email = 'yourname@gmail.com' } = (route.params as RouteParams) || {};

  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0); // Start with 0 (no timer initially)
  const [hasResentOnce, setHasResentOnce] = useState(false); // Track if user has resent once
  const [canResend, setCanResend] = useState(true); // Can resend immediately first time

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (hasResentOnce) {
      setCanResend(true);
    }
  }, [timer, hasResentOnce]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(''); // Clear error when user types

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (value && index === 3 && newOtp.every(digit => digit !== '')) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace to move to previous input
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (code?: string) => {
    const otpCode = code || otp.join('');
    
    if (otpCode.length !== 4) {
      setError('Please enter the complete verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate validation (replace with actual API call)
      if (otpCode === '1234') { // Mock correct code
        // Navigate to main app
        navigation.navigate('page-2'); // Replace with your main screen
      } else {
        setError('Invalid verification code. Please try again.');
        clearOtpFields();
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
      clearOtpFields();
    } finally {
      setIsLoading(false);
    }
  };

  const clearOtpFields = () => {
    setOtp(['', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    try {
      setCanResend(false);
      
      // Simulate resend API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // After first resend, start the timer
      if (!hasResentOnce) {
        setHasResentOnce(true);
        setTimer(60);
      } else {
        setTimer(60);
      }
      
      setError('');
      clearOtpFields();
      
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (error) {
      setError('Failed to resend code. Please try again.');
      setCanResend(true);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <Text style={styles.headerTitle}>Email Verification</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Email Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.emailIcon}>
              <Ionicons name="mail" size={scale(40)} color="#9AB106" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Check your Email</Text>

          {/* Subtitle */}
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitle}>We sent a code to</Text>
            <Text style={styles.email}>{email}</Text>
          </View>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => inputRefs.current[index] = ref}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                  error && styles.otpInputError
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={1}
                selectTextOnFocus
                textAlign="center"
              />
            ))}
          </View>

          {/* Error Message */}
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, !error && styles.errorTextHidden]}>
              {error || ' '}
            </Text>
          </View>

          {/* Resend Timer */}
          <View style={styles.resendContainer}>
            {timer > 0 ? (
              <Text style={styles.timerText}>
                Resend code in {formatTime(timer)}
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendCode} disabled={!canResend}>
                <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
                  Resend Code
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Submit Button */}
          <View style={styles.submitButtonContainer}>
            <AuthButton
              title="SUBMIT"
              onPress={() => handleSubmit()}
              disabled={otp.some(digit => !digit)}
              loading={isLoading}
            />
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
    width: scale(34), // Same width as back button for centering
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: verticalScale(20), // Reduced from 30
  },
  emailIcon: {
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
    marginBottom: verticalScale(15),
    textAlign: 'center',
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(40),
  },
  subtitle: {
    fontSize: scale(16),
    color: '#666',
    textAlign: 'center',
    marginBottom: verticalScale(5),
  },
  email: {
    fontSize: scale(16),
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(10),
    paddingHorizontal: scale(20),
  },
  otpInput: {
    width: scale(60),
    height: scale(60),
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: scale(12),
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#fff',
    marginHorizontal: scale(5),
  },
  otpInputFilled: {
    borderColor: '#9AB106',
    backgroundColor: '#F9FCF5',
  },
  otpInputError: {
    borderColor: '#F44336',
  },
  errorContainer: {
    minHeight: verticalScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  errorText: {
    fontSize: scale(14),
    color: '#F44336',
    textAlign: 'center',
  },
  errorTextHidden: {
    opacity: 0,
  },
  resendContainer: {
    minHeight: verticalScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(30),
  },
  timerText: {
    fontSize: scale(14),
    color: '#666',
    textAlign: 'center',
  },
  resendText: {
    fontSize: scale(14),
    color: '#9AB106',
    fontWeight: '500',
    textAlign: 'center',
  },
  resendTextDisabled: {
    color: '#BDBDBD',
  },
  submitButtonContainer: {
    width: '100%',
    paddingHorizontal: scale(10),
  },
});