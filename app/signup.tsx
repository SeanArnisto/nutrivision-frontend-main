import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";

import ScreenContainer from "@/components/ScreenContainer";
import CustomTextInput from "@/components/CustomTextInput";
import AuthButton from "@/components/AuthButton";
import SocialButton from "@/components/SocialButton";
import LinkButton from "@/components/LinkButton";

import { useAuthStore } from "@/stores/authStore";
import { Alert } from "react-native";

type SignUpScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "signup"
>;

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

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Responsive scaling functions
const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 812) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export default function SignUpScreen() {
  const navigation = useNavigation<SignUpScreenNavigationProp>();

  const { signUp, isLoading: authLoading, isAuthenticated } = useAuthStore();

  // Redirect authenticated users to the main app
  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('page-2');
    }
  }, [isAuthenticated, navigation]);

  const [formData, setFormData] = useState<SignUpFormData>({
    email: "",
    password: "",
    confirmPassword: "",
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
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Call Zustand store signup
      const { data, error } = await signUp(formData.email, formData.password);

      if (error) {
        // Handle Supabase errors
        let errorMessage = "Sign up failed. Please try again.";

        // Fix error checking - error might be string or object
        const errorMsg = error.message || error;

        if (errorMsg.includes && errorMsg.includes("already registered")) {
          errorMessage =
            "This email is already registered. Please try logging in instead.";
        } else if (
          errorMsg.includes &&
          errorMsg.includes("Password should be")
        ) {
          errorMessage =
            "Password is too weak. Please choose a stronger password.";
        }

        setErrors({ general: errorMessage });
      } else if (data?.user) {
        // Success - show email verification message
        Alert.alert(
          "Check Your Email",
          "Please check your email and click the verification link to complete your registration.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("login"),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    console.log("Google sign up pressed");
  };

  const handleFacebookSignUp = () => {
    console.log("Facebook sign up pressed");
  };

  const handleLoginNavigation = () => {
    navigation.navigate("login");
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Container */}
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/nutrivision_headstarted.png")}
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
              onChangeText={(email) =>
                setFormData((prev) => ({ ...prev, email }))
              }
              placeholder="Enter your email"
              keyboardType="email-address"
              autoComplete="email"
              error={errors.email}
            />

            <CustomTextInput
              label="Password"
              value={formData.password}
              onChangeText={(password) =>
                setFormData((prev) => ({ ...prev, password }))
              }
              placeholder="Enter your password"
              secureTextEntry
              autoComplete="password"
              error={errors.password}
            />

            <CustomTextInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(confirmPassword) =>
                setFormData((prev) => ({ ...prev, confirmPassword }))
              }
              placeholder="Confirm your password"
              secureTextEntry
              autoComplete="password"
              error={errors.confirmPassword}
            />

            {/* General Error Container */}
            <View style={styles.generalErrorContainer}>
              <Text
                style={[
                  styles.generalError,
                  !errors.general && styles.generalErrorHidden,
                ]}
              >
                {errors.general || " "}
              </Text>
            </View>

            {/* Sign Up Button Container */}
            <View style={styles.signUpButtonContainer}>
              <AuthButton
                title="SIGN UP"
                onPress={handleSignUp}
                disabled={
                  !formData.email ||
                  !formData.password ||
                  !formData.confirmPassword
                }
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
    alignItems: "center",
    minHeight: verticalScale(50),
    justifyContent: "center",
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
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(10),
    paddingVertical: verticalScale(2),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: "bold",
    color: "#333",
    lineHeight: moderateScale(30),
  },
  formContainer: {
    marginBottom: verticalScale(5),
  },
  generalErrorContainer: {
    minHeight: verticalScale(18),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(12),
    paddingHorizontal: scale(10),
  },
  generalError: {
    fontSize: scale(14),
    color: "#F44336",
    textAlign: "center",
    lineHeight: scale(18),
    flexWrap: "wrap",
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
    flexDirection: "row",
    alignItems: "center",
    minHeight: verticalScale(30),
    marginVertical: verticalScale(5),
    paddingVertical: verticalScale(2),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: scale(5),
  },
  dividerText: {
    fontSize: scale(16),
    fontWeight: "normal",
    color: "#666",
    marginHorizontal: scale(16),
    lineHeight: scale(20),
  },
  socialContainer: {
    minHeight: verticalScale(90),
    justifyContent: "space-between",
    marginBottom: verticalScale(5),
    paddingVertical: verticalScale(2),
  },
  bottomDividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: verticalScale(15),
    marginVertical: verticalScale(5),
  },
  loginLinkContainer: {
    minHeight: verticalScale(24),
    alignItems: "center",
    justifyContent: "center",
    marginTop: verticalScale(5),
    paddingVertical: verticalScale(2),
  },
});
