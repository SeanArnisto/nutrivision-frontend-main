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
import DisclaimerModal from "@/components/DisclaimerModal";

import { useAuthStore } from "@/stores/authStore";
import {
  useNutritionIntakeStore,
  fetchNutritionAverage,
} from "@/stores/nutritionIntakeStore";
import { GoogleAuthService } from "@/services/GoogleAuthService";
import { Alert } from "react-native";

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "login"
>;

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const preloadNutritionData = async () => {
  try {
    console.log("Starting nutrition data preload...");

    const nutritionIntakeStore = useNutritionIntakeStore.getState();
    const nutritionAverageStore = fetchNutritionAverage.getState();

    // Create array of promises for parallel loading
    const preloadPromises = [];

    // Fetch nutrition intake data
    if (!nutritionIntakeStore.nutritionData) {
      console.log("Adding nutrition intake to preload queue...");
      preloadPromises.push(
        nutritionIntakeStore.fetchNutritionIntake().catch((error) => {
          console.log(
            "Nutrition intake fetch failed during preload:",
            error.message
          );
          return null; // Don't fail the entire preload
        })
      );
    }

    // Fetch nutrition average data
    if (!nutritionAverageStore.nutritionDataAve) {
      console.log("Adding nutrition average to preload queue...");
      preloadPromises.push(
        nutritionAverageStore.fetchNutritionIntakeAve().catch((error) => {
          console.log(
            "Nutrition average fetch failed during preload:",
            error.message
          );
          return null; // Don't fail the entire preload
        })
      );
    }

    // Fetch nutritional history
    if (nutritionIntakeStore.nutritionalHistory.length === 0) {
      console.log("Adding nutritional history to preload queue...");
      preloadPromises.push(
        nutritionIntakeStore.fetchNutritionalHistory(30).catch((error) => {
          console.log(
            "Nutritional history fetch failed during preload:",
            error.message
          );
          return null; // Don't fail the entire preload
        })
      );
    }

    // Wait for all promises (some may fail, but we continue)
    console.log(
      `Waiting for ${preloadPromises.length} data sources to load...`
    );
    await Promise.allSettled(preloadPromises);

    console.log("Nutrition data preload completed (some may have failed)");
    return true;
  } catch (error) {
    console.error("Preload error:", error);
    // Don't throw - allow navigation to continue
    return false;
  }
};
// Responsive scaling functions
const scale = (size: number) => (screenWidth / 375) * size; // Base on iPhone X width
const verticalScale = (size: number) => (screenHeight / 812) * size; // Base on iPhone X

// Moderate scaling for elements that shouldn't scale as much
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const { signIn, isLoading: authLoading, isAuthenticated } = useAuthStore();

  // Redirect authenticated users to the main app
  useEffect(() => {
    if (isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: "page-2" }],
      });
    }
  }, [isAuthenticated, navigation]);

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDisclaimerModalVisible, setIsDisclaimerModalVisible] =
    useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const { data, error } = await signIn(formData.email, formData.password);

      if (error) {
        // ... existing error handling
      } else if (data?.user) {
        console.log("Login successful:", data.user.email);

        try {
          // Try to preload data, but don't block navigation on failure
          await preloadNutritionData();
        } catch (preloadError) {
          console.log(
            "Preload failed, but continuing with navigation:",
            preloadError
          );
        }

        // Navigate regardless of preload success/failure
        const isProfileComplete = useAuthStore.getState().profileComplete;

        if (isProfileComplete === false) {
          console.log("Navigating to onboarding");
          navigation.navigate("onboarding");
        } else {
          console.log("Navigating to main app");
          navigation.navigate("page-2");
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setErrors({
        general:
          error.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setErrors({});

    try {
      console.log("Starting Google OAuth login...");
      const { data, error } = await GoogleAuthService.signInWithGoogle();

      if (error) {
        console.error("Google login error:", error);
        setErrors({ general: error.message || "Google sign-in failed. Please try again." });
        return;
      }

      if (data?.session?.user) {
        console.log("Google login successful:", data.session.user.email);
        
        try {
          // Check profile completion first
          const isProfileComplete = useAuthStore.getState().profileComplete;

          if (isProfileComplete === false) {
            console.log("🆕 New Google user - navigating to onboarding");
            // For new users, go directly to onboarding without preloading nutrition data
            navigation.reset({
              index: 0,
              routes: [{ name: 'onboarding' }],
            });
          } else {
            console.log("👤 Existing Google user - preloading data and navigating to main app");
            // For existing users, preload nutrition data before going to main app
            await preloadNutritionData();
            navigation.reset({
              index: 0,
              routes: [{ name: 'page-2' }],
            });
          }
        } catch (preloadError) {
          console.error("Failed to preload data after Google login:", preloadError);
          // Still navigate but show a warning
          setErrors({
            general: "Login successful but some data failed to load. You may experience slower page loads.",
          });

          // Navigate anyway after a short delay
          setTimeout(() => {
            const isProfileComplete = useAuthStore.getState().profileComplete;
            if (isProfileComplete === false) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'onboarding' }],
              });
            } else {
              navigation.reset({
                index: 0,
                routes: [{ name: 'page-2' }],
              });
            }
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error("Unexpected Google login error:", error);
      setErrors({
        general: error.message || "An unexpected error occurred during Google sign-in. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = () => {
    console.log("Facebook login pressed");
  };

  const handleForgotPassword = () => {
    navigation.navigate("forgot-email");
  };

  const handleCreateAccount = () => {
    setIsDisclaimerModalVisible(true);
  };

  const handleDisclaimerClose = () => {
    setIsDisclaimerModalVisible(false);
  };

  const handleDisclaimerAgree = () => {
    setIsDisclaimerModalVisible(false);
    navigation.navigate("signup");
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
          {/* Logo Container - Responsive with maintained proportions */}
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/nutrixtract_headstarted.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title Container - Responsive min-height */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Log In</Text>
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
              showForgotPassword={true}
              onForgotPasswordPress={handleForgotPassword}
            />

            {/* General Error Container - Reserved responsive space */}
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

            {/* Login Button Container - Responsive */}
            <View style={styles.loginButtonContainer}>
              <AuthButton
                title="LOG IN"
                onPress={handleLogin}
                disabled={!formData.email || !formData.password}
                loading={isLoading}
              />
            </View>
          </View>

          {/* Divider Container - Responsive */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Container - Flexible height that maintains proportions */}
          <View style={styles.socialContainer}>
            <SocialButton
              provider="google"
              onPress={handleGoogleLogin}
              disabled={isLoading}
            />

            <SocialButton
              provider="facebook"
              onPress={handleFacebookLogin}
              disabled={isLoading}
            />
          </View>

          {/* Bottom Divider Container - Responsive */}
          <View style={styles.bottomDividerContainer}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerLine} />
          </View>

          {/* Create Account Container - Responsive */}
          <View style={styles.createAccountContainer}>
            <LinkButton
              title="Create an Account"
              onPress={handleCreateAccount}
              color="#333"
              size="large"
              underline
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Disclaimer Modal - Always rendered but controlled by state */}
      <DisclaimerModal
        visible={isDisclaimerModalVisible}
        onClose={handleDisclaimerClose}
        onAgree={handleDisclaimerAgree}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: scale(20), // Reduced from 24
    paddingTop: verticalScale(5), // Reduced from 10
    paddingBottom: verticalScale(5), // Reduced from 10
  },
  logoContainer: {
    alignItems: "center",
    minHeight: verticalScale(50), // Reduced from 80
    justifyContent: "center",
    marginBottom: verticalScale(5), // Reduced from 10
    paddingVertical: verticalScale(2), // Reduced padding
  },
  logo: {
    width: scale(220), // Reduced from 260
    height: verticalScale(50), // Reduced from 70
    maxWidth: screenWidth * 0.6, // Reduced from 0.7
    maxHeight: verticalScale(60), // Reduced from 80
  },
  titleContainer: {
    minHeight: verticalScale(30), // Reduced from 40
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(10), // Reduced from 20
    paddingVertical: verticalScale(2), // Reduced padding
  },
  title: {
    fontSize: moderateScale(24), // Moderate scaling for better readability
    fontWeight: "bold",
    color: "#333",
    lineHeight: moderateScale(30),
  },
  formContainer: {
    marginBottom: verticalScale(5), // Reduced from 10
  },
  forgotPasswordContainer: {
    minHeight: verticalScale(24), // Reduced from 32
    alignItems: "flex-end",
    justifyContent: "center",
    marginBottom: verticalScale(5), // Reduced from 10
    paddingVertical: verticalScale(2), // Reduced padding
  },
  generalErrorContainer: {
    minHeight: verticalScale(18),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(12), // Increased slightly since we removed forgot password container
    paddingHorizontal: scale(10),
  },
  generalError: {
    fontSize: scale(14),
    color: "#F44336",
    textAlign: "center",
    lineHeight: scale(18),
    flexWrap: "wrap", // Allow wrapping on smaller screens
  },
  generalErrorHidden: {
    opacity: 0, // Hide but maintain space
  },
  loginButtonContainer: {
    minHeight: verticalScale(44), // Reduced from 48
    marginBottom: verticalScale(5), // Reduced from 10
    paddingVertical: verticalScale(1), // Reduced padding
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: verticalScale(30), // Reduced from 40
    marginVertical: verticalScale(5), // Reduced from 10
    paddingVertical: verticalScale(2), // Reduced padding
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
    minHeight: verticalScale(90), // Reduced from 120
    justifyContent: "space-between",
    marginBottom: verticalScale(5), // Reduced from 10
    paddingVertical: verticalScale(2), // Reduced padding
  },
  bottomDividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: verticalScale(15), // Reduced from 20
    marginVertical: verticalScale(5), // Reduced from 10
  },
  createAccountContainer: {
    minHeight: verticalScale(24), // Reduced from 32
    alignItems: "center",
    justifyContent: "center",
    marginTop: verticalScale(5), // Reduced from 10
    paddingVertical: verticalScale(2), // Reduced padding
  },
});
