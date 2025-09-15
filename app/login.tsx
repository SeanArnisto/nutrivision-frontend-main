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
    console.log("🚀 Starting complete nutrition data preload...");

    // Get store instances
    const nutritionIntakeStore = useNutritionIntakeStore.getState();
    const nutritionAverageStore = fetchNutritionAverage.getState();

    console.log("📊 Initial store state:", {
      hasNutritionData: !!nutritionIntakeStore.nutritionData,
      historyLength: nutritionIntakeStore.nutritionalHistory?.length || 0,
      hasAverageData: !!nutritionAverageStore.nutritionDataAve,
    });

    // Create array of promises for parallel loading
    const preloadPromises = [];

    // Fetch nutrition intake data (used in both Statistics and Page2)
    if (!nutritionIntakeStore.nutritionData) {
      console.log("📈 Adding nutrition intake to preload queue...");
      preloadPromises.push(nutritionIntakeStore.fetchNutritionIntake());
    }

    // Fetch nutrition average data (used in Statistics)
    if (!nutritionAverageStore.nutritionDataAve) {
      console.log("📊 Adding nutrition average to preload queue...");
      preloadPromises.push(nutritionAverageStore.fetchNutritionIntakeAve());
    }

    // Fetch 30-day nutritional history (used in Statistics)
    if (nutritionIntakeStore.nutritionalHistory.length === 0) {
      console.log("📅 Adding nutritional history to preload queue...");
      preloadPromises.push(nutritionIntakeStore.fetchNutritionalHistory(30));
    }

    // Wait for ALL data to load
    console.log(
      `⏳ Waiting for ${preloadPromises.length} data sources to load...`
    );
    await Promise.all(preloadPromises);

    // Verify final state
    const finalIntakeStore = useNutritionIntakeStore.getState();
    const finalAverageStore = fetchNutritionAverage.getState();

    console.log("🎯 Final store state:", {
      hasNutritionData: !!finalIntakeStore.nutritionData,
      historyLength: finalIntakeStore.nutritionalHistory?.length || 0,
      hasAverageData: !!finalAverageStore.nutritionDataAve,
      errors: {
        intake: finalIntakeStore.error,
        history: finalIntakeStore.historyError,
        average: finalAverageStore.error,
      },
    });

    console.log("✅ All nutrition data preloaded successfully");
    return true;
  } catch (error) {
    console.error("❌ Error preloading nutrition data:", error);
    throw error; // Re-throw to handle in login function
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
        routes: [{ name: 'page-2' }],
      });
    }
  }, [isAuthenticated, navigation]);

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDisclaimerModalVisible, setIsDisclaimerModalVisible] = useState(false);

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
        // Handle Supabase login errors (keep existing error handling)
        let errorMessage = "Login failed. Please check your credentials.";

        const errorMsg = error.message || error;

        if (
          errorMsg.includes &&
          errorMsg.includes("Invalid login credentials")
        ) {
          errorMessage =
            "Invalid email or password. Please check your credentials.";
        } else if (
          errorMsg.includes &&
          errorMsg.includes("Email not confirmed")
        ) {
          errorMessage =
            "Please check your email and confirm your account before logging in.";
        } else if (
          errorMsg.includes &&
          errorMsg.includes("Too many requests")
        ) {
          errorMessage = "Too many login attempts. Please try again later.";
        }

        setErrors({ general: errorMessage });
      } else if (data?.user) {
        // Login successful - now preload ALL data before navigation
        console.log("Login successful:", data.user.email);

        try {
          // WAIT for all nutrition data to be preloaded
          await preloadNutritionData();

          // Only navigate after all data is ready
          const isProfileComplete = useAuthStore.getState().profileComplete;

          if (isProfileComplete === false) {
            console.log("User has no existing metadata - navigating to onboarding");
            navigation.reset({
              index: 0,
              routes: [{ name: 'onboarding' }],
            });
          } else {
            console.log("User has existing metadata - navigating to main app with preloaded data");
            navigation.reset({
              index: 0,
              routes: [{ name: 'page-2' }],
            });
          }
        } catch (preloadError) {
          console.error("Failed to preload data:", preloadError);
          // Still navigate but show a warning
          setErrors({
            general:
              "Login successful but some data failed to load. You may experience slower page loads.",
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
          // Preload nutrition data just like regular login
          await preloadNutritionData();

          // Check profile completion and navigate accordingly
          const isProfileComplete = useAuthStore.getState().profileComplete;

          if (isProfileComplete === false) {
            console.log("New Google user - navigating to onboarding");
            navigation.reset({
              index: 0,
              routes: [{ name: 'onboarding' }],
            });
          } else {
            console.log("Existing Google user - navigating to main app");
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
