import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "@/types/types";

import ScreenContainer from "@/components/ScreenContainer";
import CustomTextInput from "@/components/CustomTextInput";
import AuthButton from "@/components/AuthButton";
import Loading from "./loading";
import { generateOTP } from "@/utils/OtpUtils";

type ForgotPasswordEmailNavigationProp = StackNavigationProp<
  RootStackParamList,
  "forgot-email"
>;

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const scale = (size: number) => (screenWidth / 375) * size;
const verticalScale = (size: number) => (screenHeight / 812) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export default function ForgotPasswordEmailScreen() {
  const navigation = useNavigation<ForgotPasswordEmailNavigationProp>();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleNext = async () => {
    setError("");

    if (!email) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // dito mag gegenerate yung otp bago mag next screen
      const newOTP = generateOTP();
      setOtp(newOTP);
      // legit api call na
      const response = await fetch(
        "https://leidanielaguila-nutrivision.hf.space/send-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            otp: newOTP,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send OTP");
      }

      const data = await response.json();
      console.log("OTP sent successfully:", data);

      // Navigate to OTP screen with email
      navigation.navigate("forgot-otp", { email });
    } catch (error) {
      setError("Failed to send reset code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <ScreenContainer>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={scale(24)} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Forgot Password</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.formContainer}>
              <CustomTextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoComplete="email"
                error={error}
              />

              <View style={styles.nextButtonContainer}>
                <AuthButton
                  title="NEXT"
                  onPress={handleNext}
                  disabled={!email}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(15),
    paddingTop: verticalScale(10),
  },
  backButton: {
    padding: scale(5),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    color: "#333",
  },
  headerPlaceholder: {
    width: scale(34),
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(20),
    justifyContent: "center",
  },
  formContainer: {
    marginTop: verticalScale(-100), // Center the form higher on screen
  },
  nextButtonContainer: {
    marginTop: verticalScale(20),
  },
});
