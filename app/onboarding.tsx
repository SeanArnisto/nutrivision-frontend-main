import React, { useState, useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";

import ScreenContainer from "@/components/ScreenContainer";
import Header from "@/components/Header";
import TitleSection from "@/components/TitleSection";
import SelectionButton from "@/components/SelectionButton";
import PrimaryButton from "@/components/PrimaryButton";
import InfoCard from "@/components/InfoCard";
import NumericInput from "@/components/NumericInput";
import CustomTextInput from "@/components/CustomTextInput";
import Toast, { ToastType } from "@/components/Toast";
import ThankYouStep from "@/components/ThankYouStep";

import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/config/supabase";

type OnboardingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "onboarding"
>;

interface OnboardingData {
  fullName: string;
  gender: "male" | "female" | null;
  age: string;
  height: string;
  weight: string;
}

export default function OnboardingScreen() {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { isAuthenticated } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [progressAnimation] = useState(new Animated.Value(1));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthenticated) {
      navigation.replace('login');
    }
  }, [isAuthenticated, navigation]);

  // Add initialization delay to prevent premature validation from Google OAuth
  useEffect(() => {
    const initTimer = setTimeout(() => {
      setIsInitializing(false);
      console.log('🎯 Onboarding screen initialized for new user setup');
    }, 500); // Small delay to ensure smooth transition

    return () => clearTimeout(initTimer);
  }, []);

  const [formData, setFormData] = useState<OnboardingData>({
    fullName: "",
    gender: null,
    age: "",
    height: "",
    weight: "",
  });

  const [toast, setToast] = useState<{
    visible: boolean;
    type: ToastType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: "info",
    title: "",
    message: "",
  });

  const totalSteps = 6; // Full Name, Gender, Age, Height, Weight, Thank You

  const showToast = (type: ToastType, title: string, message: string) => {
    // Don't show validation toasts during initialization (prevents Google OAuth validation issues)
    if (isInitializing && type === "error") {
      console.log('🚫 Preventing validation toast during initialization:', message);
      return;
    }
    setToast({ visible: true, type, title, message });
  };

  const validateFullName = (name: string): boolean => {
    const trimmedName = name.trim();
    return trimmedName.length >= 2 && /^[a-zA-Z\s]+$/.test(trimmedName);
  };

  const saveProfileToSupabase = async () => {
    try {
      setIsSubmitting(true);
      const { user } = useAuthStore.getState();

      if (!user) {
        showToast(
          "error",
          "Error!",
          "User not found. Please try logging in again."
        );
        return false;
      }

      // Prepare the profile data
      const profileData = {
        id: user.id,
        email: user.email,
        name: formData.fullName.trim(),
        gender: formData.gender,
        age: parseInt(formData.age),
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        updated_at: new Date().toISOString(),
      };

      // Insert or update profile in Supabase
      const { data, error } = await supabase
        .from("profiles")
        .upsert(profileData, {
          onConflict: "id",
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving profile:", error);
        showToast(
          "error",
          "Check Internet Connection!",
          "Failed to save profile. Please try again."
        );
        return false;
      }

      console.log("Profile saved successfully:", data);

      // Update the auth store to mark profile as complete
      const { checkProfileComplete } = useAuthStore.getState();
      await checkProfileComplete();

      showToast("success", "Success!", "Profile saved successfully!");
      return true;
    } catch (error) {
      console.error("Profile save error:", error);
      showToast(
        "error",
        "Check Internet Connection!",
        "An unexpected error occurred. Please try again."
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const animateProgress = (step: number) => {
    Animated.timing(progressAnimation, {
      toValue: step,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.fullName.trim()) {
          showToast("error", "Error!", "Please enter your full name");
          return false;
        }
        if (!validateFullName(formData.fullName)) {
          showToast(
            "error",
            "Error!",
            "Please enter a valid full name (at least 2 characters, letters only)"
          );
          return false;
        }
        break;

      case 2:
        if (!formData.gender) {
          showToast("error", "Error!", "Please select your gender");
          return false;
        }
        break;

      case 3:
        const ageValue = parseFloat(formData.age);
        if (!formData.age || isNaN(ageValue)) {
          showToast("error", "Error!", "Please enter a valid age");
          return false;
        }
        if (ageValue < 18 || ageValue > 120) {
          showToast(
            "error",
            "Error!",
            "Users must only be 18 to 120 years old"
          );
          return false;
        }
        break;

      case 4:
        const heightValue = parseFloat(formData.height);
        if (!formData.height || isNaN(heightValue)) {
          showToast("error", "Error!", "Please enter a valid height");
          return false;
        }
        if (heightValue < 140 || heightValue > 188) {
          showToast("error", "Error!", "Height must be between 140-188 cm");
          return false;
        }
        break;

      case 5:
        const weightValue = parseFloat(formData.weight);
        if (!formData.weight || isNaN(weightValue)) {
          showToast("error", "Error!", "Please enter a valid weight");
          return false;
        }
        if (weightValue < 40 || weightValue > 120) {
          showToast("error", "Error!", "Weight must be between 40-120 kg");
          return false;
        }
        break;
    }
    return true;
  };

  const handleContinue = async () => {
    // Validate current step only when Continue is clicked
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      animateProgress(nextStep);

      if (currentStep < 5) {
        // Don't show success toast on thank you step
        showToast("success", "Success!", "Step completed successfully");
      }
    } else {
      // This is the final step - save to Supabase before navigating
      const saveSuccess = await saveProfileToSupabase();

      if (saveSuccess) {
        // Navigate to main app after successful save
        navigation.navigate("page-2");
      }
      // If save fails, stay on current screen and show error (handled in saveProfileToSupabase)
    }
  };

  const handleBackPress = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      animateProgress(prevStep);
    } else {
      navigation.goBack();
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <FullNameStep
            fullName={formData.fullName}
            onFullNameChange={(fullName) =>
              setFormData((prev) => ({ ...prev, fullName }))
            }
          />
        );
      case 2:
        return (
          <GenderStep
            selectedGender={formData.gender}
            onGenderSelect={(gender) =>
              setFormData((prev) => ({ ...prev, gender }))
            }
          />
        );
      case 3:
        return (
          <AgeStep
            age={formData.age}
            onAgeChange={(age) => setFormData((prev) => ({ ...prev, age }))}
          />
        );
      case 4:
        return (
          <HeightStep
            height={formData.height}
            onHeightChange={(height) =>
              setFormData((prev) => ({ ...prev, height }))
            }
          />
        );
      case 5:
        return (
          <WeightStep
            weight={formData.weight}
            onWeightChange={(weight) =>
              setFormData((prev) => ({ ...prev, weight }))
            }
          />
        );
      case 6:
        return <ThankYouStep />;
      default:
        return null;
    }
  };

  const getContinueButtonState = () => {
    // Disable button if submitting
    if (isSubmitting) return true;

    switch (currentStep) {
      case 1:
        return !formData.fullName.trim();
      case 2:
        return !formData.gender;
      case 3:
        return !formData.age;
      case 4:
        return !formData.height;
      case 5:
        return !formData.weight;
      case 6:
        return false; // Always enabled on thank you step (unless submitting)
      default:
        return true;
    }
  };

  const getContinueButtonText = () => {
    if (isSubmitting) return "Saving...";
    if (currentStep === 6) return "Complete Setup";
    return "Continue";
  };

  return (
    <ScreenContainer>
      <Header
        currentStep={currentStep}
        totalSteps={currentStep === 6 ? 0 : 5} // Hide progress bar on thank you step
        showBackButton={true} // Always show back button
        showLogo={true} // Always show logo
        onBackPress={handleBackPress}
        progressAnimation={progressAnimation}
      />

      <Toast
        type={toast.type}
        title={toast.title}
        message={toast.message}
        visible={toast.visible}
        onClose={hideToast}
      />

      <View style={styles.content}>{getStepContent()}</View>

      <View style={styles.bottomContainer}>
        <PrimaryButton
          title={getContinueButtonText()}
          onPress={handleContinue}
          disabled={getContinueButtonState()}
        />
      </View>
    </ScreenContainer>
  );
}

// Step Components

interface FullNameStepProps {
  fullName: string;
  onFullNameChange: (fullName: string) => void;
}

function FullNameStep({ fullName, onFullNameChange }: FullNameStepProps) {
  return (
    <>
      <TitleSection
        title="Enter your Full Name"
        description="We need your name to personalize your experience and provide better recommendations."
      />

      <InfoCard
        title="Name Requirements"
        subtitle="At least 2 characters, letters and spaces only"
        editable={false}
      />

      <View style={styles.inputContainer}>
        <CustomTextInput
          label="Full Name"
          value={fullName}
          onChangeText={onFullNameChange}
          placeholder="Enter your full name"
          autoComplete="name"
        />
      </View>
    </>
  );
}

interface GenderStepProps {
  selectedGender: "male" | "female" | null;
  onGenderSelect: (gender: "male" | "female") => void;
}

function GenderStep({ selectedGender, onGenderSelect }: GenderStepProps) {
  return (
    <>
      <TitleSection
        title="Choose your Gender"
        description="Gender affects nutrient intake by influencing metabolism, muscle mass, and dietary needs."
      />

      <View style={styles.selectionContainer}>
        <SelectionButton
          title="Male"
          selected={selectedGender === "male"}
          onPress={() => onGenderSelect("male")}
        />

        <SelectionButton
          title="Female"
          selected={selectedGender === "female"}
          onPress={() => onGenderSelect("female")}
        />
      </View>
    </>
  );
}

interface AgeStepProps {
  age: string;
  onAgeChange: (age: string) => void;
}

function AgeStep({ age, onAgeChange }: AgeStepProps) {
  const minAge = 18;
  const maxAge = 120;

  return (
    <>
      <TitleSection
        title="Choose your Age"
        description="Age affects nutrient intake by changing metabolism, absorption, and dietary needs."
      />

      <InfoCard
        title="Users must only be"
        subtitle={`${minAge} to ${maxAge} years old`}
        editable={false}
      />

      <NumericInput
        value={age}
        onChangeText={onAgeChange}
        placeholder="Enter your age"
        minValue={minAge}
        maxValue={maxAge}
        unit="years"
        onValidationChange={() => {}} // No real-time validation
      />
    </>
  );
}

interface HeightStepProps {
  height: string;
  onHeightChange: (height: string) => void;
}

function HeightStep({ height, onHeightChange }: HeightStepProps) {
  const minHeight = 140;
  const maxHeight = 188;

  const getHeightRangeText = () => {
    const minFeet = Math.floor(minHeight / 30.48);
    const minInches = Math.round(((minHeight / 30.48) % 1) * 12);
    const maxFeet = Math.floor(maxHeight / 30.48);
    const maxInches = Math.round(((maxHeight / 30.48) % 1) * 12);

    return `${minHeight}-${maxHeight} cm (${minFeet}'${minInches}" - ${maxFeet}'${maxInches}")`;
  };

  return (
    <>
      <TitleSection
        title="Choose your Height"
        description="Height affects nutrient needs, growth, and overall energy requirements."
      />

      <InfoCard
        title="Height Range must only be"
        subtitle={getHeightRangeText()}
        editable={false}
      />

      <NumericInput
        value={height}
        onChangeText={onHeightChange}
        placeholder="Enter height in cm"
        minValue={minHeight}
        maxValue={maxHeight}
        unit="cm"
        onValidationChange={() => {}} // No real-time validation
      />
    </>
  );
}

interface WeightStepProps {
  weight: string;
  onWeightChange: (weight: string) => void;
}

function WeightStep({ weight, onWeightChange }: WeightStepProps) {
  const minWeight = 40;
  const maxWeight = 120;

  // Convert weight to lbs for display
  const getWeightRangeText = () => {
    const minLbs = Math.round(minWeight * 2.20462);
    const maxLbs = Math.round(maxWeight * 2.20462);
    return `${minWeight} - ${maxWeight} kg or ${minLbs} - ${maxLbs} lbs`;
  };

  return (
    <>
      <TitleSection
        title="Choose your Weight"
        description="Weight influences nutrient intake by affecting metabolism, energy needs, and nutrient absorption."
      />

      <InfoCard
        title="Weight Range must only be"
        subtitle={getWeightRangeText()}
        editable={false}
      />

      <NumericInput
        value={weight}
        onChangeText={onWeightChange}
        placeholder="Enter weight in kg"
        minValue={minWeight}
        maxValue={maxWeight}
        unit="kg"
        onValidationChange={() => {}} // No real-time validation
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 20,
  },
  selectionContainer: {
    flex: 1,
    alignItems: "center",
    paddingTop: 40,
  },
  inputContainer: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  textInput: {
    marginBottom: 20,
  },
  bottomContainer: {
    alignItems: "center",
    paddingBottom: 40,
  },
});