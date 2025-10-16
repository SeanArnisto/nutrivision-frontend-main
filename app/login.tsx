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
import Loading from "@/app/loading";

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
    console.log("🚀 Starting nutrition data preload...");

    const nutritionIntakeStore = useNutritionIntakeStore.getState();
    const nutritionAverageStore = fetchNutritionAverage.getState();

    // Create array of promises for parallel loading
    const preloadPromises = [];

    // Fetch nutrition intake data
    if (!nutritionIntakeStore.nutritionData) {
      console.log("🧩 Preloading: Nutrition intake...");
      preloadPromises.push(nutritionIntakeStore.fetchNutritionIntake());
    }

    // Fetch nutrition average data
    if (!nutritionAverageStore.nutritionDataAve) {
      console.log("🧩 Preloading: Nutrition average...");
      preloadPromises.push(nutritionAverageStore.fetchNutritionIntakeAve());
    }

    // Fetch nutritional history
    if (nutritionIntakeStore.nutritionalHistory.length === 0) {
      console.log("🧩 Preloading: Nutritional history...");
      preloadPromises.push(nutritionIntakeStore.fetchNutritionalHistory(30));
    }

    console.log(
      `⏳ Waiting for ${preloadPromises.length} data sources to load...`
    );

    // Wait for all promises to settle
    const results = await Promise.allSettled(preloadPromises);

    // Check if any failed
    const failed = results.filter((res) => res.status === "rejected");

    if (failed.length > 0) {
      console.error("❌ Some preload operations failed:");
      failed.forEach((f, index) => {
        console.error(
          `   - Task ${index + 1} failed:`,
          f.reason?.message || f.reason
        );
      });
      return false; // Indicate failure
    }

    console.log("✅ All nutrition data preloaded successfully!");
    return true; // All good
  } catch (error) {
    console.error("🔥 Preload error:", error);
    return false;
  }
};

// Responsive scaling functions
const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 812) * size;
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
  const [isLoadingData, setIsLoadingData] = useState(false);
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
        if (error.message.includes("Invalid login credentials")) {
          setErrors({
            general: "Incorrect email or password. Please try again.",
          });
        } else if (error.message.includes("Email not confirmed")) {
          setErrors({
            general: "Please confirm your email before logging in.",
          });
        } else {
          setErrors({
            general: error.message || "Login failed. Please try again.",
          });
        }
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        console.log("✅ Login successful:", data.user.email);

        const isProfileComplete = useAuthStore.getState().profileComplete;
        if (isProfileComplete === false) {
          console.log("Navigating to onboarding...");
          setIsLoading(false);
          navigation.navigate("onboarding");
          return;
        }

        // Set loading state for data fetching
        setIsLoading(false);
        setIsLoadingData(true);        
         navigation.reset({
        index: 0,
        routes: [{ name: "page-2" }],
      });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setErrors({
        general:
          error.message || "An unexpected error occurred. Please try again.",
      });
      setIsLoading(false);
      setIsLoadingData(false);
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

  // Show loading screen while fetching data
  if (isLoadingData) {
    return <Loading />;
  }

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
          {Platform.OS === "ios" && (
            <>
              {/* <View style={styles.dividerContainer}>
                {Platform.OS === "ios" && (
                  <>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>Or</Text>
                    <View style={styles.dividerLine} />
                  </>
                )}
              </View> */}

              {/* Social Login Container - Flexible height that maintains proportions */}
              {/* <View style={styles.socialContainer}>
                {Platform.OS === "ios" && (
                  <>
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
                  </>
                )}
              </View> */}

              {/* Bottom Divider Container - Responsive */}
              {/* <View style={styles.bottomDividerContainer}>
                <View style={styles.dividerLine} />
                <View style={styles.dividerLine} />
              </View> */}
            </>
          )}

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
  forgotPasswordContainer: {
    minHeight: verticalScale(24),
    alignItems: "flex-end",
    justifyContent: "center",
    marginBottom: verticalScale(5),
    paddingVertical: verticalScale(2),
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
  loginButtonContainer: {
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
  createAccountContainer: {
    minHeight: verticalScale(24),
    alignItems: "center",
    justifyContent: "center",
    marginTop: verticalScale(5),
    paddingVertical: verticalScale(2),
  },
});
