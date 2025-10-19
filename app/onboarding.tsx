import React, { useState, useEffect } from "react";
import { View, StyleSheet, Animated, Text,  } from "react-native";
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { TouchableOpacity } from "react-native";
import { Feather, Ionicons } from '@expo/vector-icons';
import { Platform } from "react-native";
import { Icon } from "react-native-screens";
import { ScrollView } from "react-native"; // ✅ Add this to your imports at the top

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
  hasHealthCondition: boolean;  
  avgCarbs: string;  // ✅ Changed from customCarbs
  avgSodium: string;  // ✅ Changed from customSodium
  avgProtein: string;  // ✅ Changed from customProtein
  avgCalories: string;  // ✅ Changed from customCalories
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
    hasHealthCondition: false,
    avgCarbs: "",  // ✅ Changed from customCarbs
    avgSodium: "",  // ✅ Changed from customSodium
    avgProtein: "",  // ✅ Changed from customProtein
    avgCalories: "",  // ✅ Changed from customCalories
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

  const totalSteps = 8; // Full Name, Gender, Age, Height, Weight, Thank You, Sex tayo

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

    // Step 1: Save basic profile data to profiles table
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

    const { data: profileResult, error: profileError } = await supabase
      .from("profiles")
      .upsert(profileData, {
        onConflict: "id",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (profileError) {
      console.error("Error saving profile:", profileError);
      showToast(
        "error",
        "Check Internet Connection!",
        "Failed to save profile. Please try again."
      );
      return false;
    }

    console.log("Profile saved successfully:", profileResult);

    // Step 2: Save nutrition intake data ONLY if user has health condition
    if (formData.hasHealthCondition) {
      const nutritionData = {
        user_id: user.id,
        avg_calories: parseFloat(formData.avgCalories),
        avg_carbs: parseFloat(formData.avgCarbs),
        avg_protein: parseFloat(formData.avgProtein),
        avg_sodium: parseFloat(formData.avgSodium),
        updated_at: new Date().toISOString(),
      };

      const { data: nutritionResult, error: nutritionError } = await supabase
        .from("user_nutrition_intake")
        .upsert(nutritionData, {
          onConflict: "user_id",
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (nutritionError) {
        console.error("Error saving nutrition intake:", nutritionError);
        showToast(
          "error",
          "Check Internet Connection!",
          "Failed to save nutrition data. Please try again."
        );
        return false;
      }

      console.log("Nutrition intake saved successfully:", nutritionResult);
    } else {
      // If user selected "No", delete any existing nutrition intake data
      const { error: deleteError } = await supabase
        .from("user_nutrition_intake")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Error deleting nutrition intake:", deleteError);
        // Don't fail the whole process if delete fails
      }
    }

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

    case 6:  // ✅ Health condition validation
      // Since we have a default value (false), this step is always valid
      // User can choose either Yes or No
      // No validation needed - user can proceed with either option
      break;

    case 7:  // Custom intake validation (only if hasHealthCondition is true)
    if (formData.hasHealthCondition) {
      const carbsValue = parseFloat(formData.avgCarbs);  // ✅ Changed
      const sodiumValue = parseFloat(formData.avgSodium);  // ✅ Changed
      const proteinValue = parseFloat(formData.avgProtein);  // ✅ Changed
      const caloriesValue = parseFloat(formData.avgCalories);  // ✅ Changed

      if (!formData.avgCalories || isNaN(caloriesValue) || caloriesValue <= 0) {  // ✅ Changed
        showToast("error", "Error!", "Please enter a valid calorie intake");
        return false;
      }
      if (!formData.avgCarbs || isNaN(carbsValue) || carbsValue <= 0) {  // ✅ Changed
        showToast("error", "Error!", "Please enter a valid carbohydrate intake");
        return false;
      }
      if (!formData.avgProtein || isNaN(proteinValue) || proteinValue <= 0) {  // ✅ Changed
        showToast("error", "Error!", "Please enter a valid protein intake");
        return false;
      }
      if (!formData.avgSodium || isNaN(sodiumValue) || sodiumValue <= 0) {  // ✅ Changed
        showToast("error", "Error!", "Please enter a valid sodium intake");
        return false;
      }
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
    let nextStep = currentStep + 1;
    
    // ✅ Skip step 7 (custom intake) if user selected "No" for health condition
    if (currentStep === 6 && formData.hasHealthCondition === false) {
      nextStep = 8; // Skip to thank you step
    }
    
    setCurrentStep(nextStep);
    animateProgress(nextStep);

    if (nextStep < 8) {
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
    case 6:  // ✅ New health condition step
      return (
        <HealthConditionStep
          hasHealthCondition={formData.hasHealthCondition}
          onHealthConditionSelect={(hasHealthCondition) =>
            setFormData((prev) => ({ ...prev, hasHealthCondition }))
          }
        />
      );
    case 7:  // Custom intake step
    return (
      <CustomIntakeStep
        avgCarbs={formData.avgCarbs}  // ✅ Changed
        avgSodium={formData.avgSodium}  // ✅ Changed
        avgProtein={formData.avgProtein}  // ✅ Changed
        avgCalories={formData.avgCalories}  // ✅ Changed
        onCarbsChange={(avgCarbs) =>  // ✅ Changed
          setFormData((prev) => ({ ...prev, avgCarbs }))
        }
        onSodiumChange={(avgSodium) =>  // ✅ Changed
          setFormData((prev) => ({ ...prev, avgSodium }))
        }
        onProteinChange={(avgProtein) =>  // ✅ Changed
          setFormData((prev) => ({ ...prev, avgProtein }))
        }
        onCaloriesChange={(avgCalories) =>  // ✅ Changed
          setFormData((prev) => ({ ...prev, avgCalories }))
        }
      />
    );
    case 8:  // ✅ Updated thank you step
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
    case 6:  // ✅ Always enabled since there's a default value
      return false;
    case 7:  // Custom intake step
    if (formData.hasHealthCondition) {
      return !formData.avgCarbs || !formData.avgSodium ||   // ✅ Changed
            !formData.avgProtein || !formData.avgCalories;  // ✅ Changed
    }
    return false;
    case 8:
      return false;
    default:
      return true;
  }
};

  const getContinueButtonText = () => {
  if (isSubmitting) return "Saving...";
  if (currentStep === 8) return "Complete Setup";  // ✅ Updated
  return "Continue";
};

  return (
    <ScreenContainer>
      <Header
        currentStep={currentStep}
        totalSteps={currentStep === 8 ? 0 : 7} // Hide progress bar on thank you step
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
// ✅ New Health Condition Step Component
interface HealthConditionStepProps {
  hasHealthCondition: boolean | null;
  onHealthConditionSelect: (hasHealthCondition: boolean) => void;
}

function HealthConditionStep({ 
  hasHealthCondition, 
  onHealthConditionSelect 
}: HealthConditionStepProps) {
  return (
    <>
      <TitleSection
        title="Healthcare Professional Guidance"
        description="Have you been given specific daily intake recommendations by a healthcare professional for carbohydrates, sodium, protein, and calories?"
      />

      <InfoCard
        title="Important"
        subtitle="This helps us provide personalized recommendations based on your health needs"
        editable={false}
      />

      <View style={styles.selectionContainer}>
        {/* ✅ "No" option moved to first position */}
        <SelectionButton
          title="No, I don't have specific recommendations"
          selected={hasHealthCondition === false}
          onPress={() => onHealthConditionSelect(false)}
        />

        <SelectionButton
          title="Yes, I have specific recommendations"
          selected={hasHealthCondition === true}
          onPress={() => onHealthConditionSelect(true)}
        />
      </View>
    </>
  );
}

// ✅ New Custom Intake Step Component
interface CustomIntakeStepProps {
  avgCarbs: string;  // ✅ Changed
  avgSodium: string;  // ✅ Changed
  avgProtein: string;  // ✅ Changed
  avgCalories: string;  // ✅ Changed
  onCarbsChange: (value: string) => void;
  onSodiumChange: (value: string) => void;
  onProteinChange: (value: string) => void;
  onCaloriesChange: (value: string) => void;
}

function CustomIntakeStep({
  avgCarbs,  // ✅ Changed
  avgSodium,  // ✅ Changed
  avgProtein,  // ✅ Changed
  avgCalories,  // ✅ Changed
  onCarbsChange,
  onSodiumChange,
  onProteinChange,
  onCaloriesChange,
}: CustomIntakeStepProps) {
  return (
    <>
      <TitleSection
        title="Enter Your Daily Intake"
        description="Please enter the daily intake values recommended by your healthcare professional."
      />

      <InfoCard
        title="Professional Recommendations"
        subtitle="Enter the exact values provided by your healthcare professional"
        editable={false}
      />

      <ScrollView 
        style={styles.customIntakeScrollView}
        contentContainerStyle={styles.customIntakeContainer}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputFieldWrapper}>
          <Text style={styles.inputLabel}>Calories</Text>
          <NumericInput
            value={avgCalories}  // ✅ Changed
            onChangeText={onCaloriesChange}
            placeholder="Enter calories"
            minValue={0}
            maxValue={10000}
            unit="kcal"
            onValidationChange={() => {}}
          />
        </View>

        <View style={styles.inputFieldWrapper}>
          <Text style={styles.inputLabel}>Carbohydrates (grams)</Text>
          <NumericInput
            value={avgCarbs}  // ✅ Changed
            onChangeText={onCarbsChange}
            placeholder="Enter carbohydrates"
            minValue={0}
            maxValue={1000}
            unit="g"
            onValidationChange={() => {}}
          />
        </View>

        <View style={styles.inputFieldWrapper}>
          <Text style={styles.inputLabel}>Protein (grams)</Text>
          <NumericInput
            value={avgProtein}  // ✅ Changed
            onChangeText={onProteinChange}
            placeholder="Enter protein"
            minValue={0}
            maxValue={500}
            unit="g"
            onValidationChange={() => {}}
          />
        </View>

        <View style={styles.inputFieldWrapper}>
          <Text style={styles.inputLabel}>Sodium (milligrams)</Text>
          <NumericInput
            value={avgSodium}  // ✅ Changed
            onChangeText={onSodiumChange}
            placeholder="Enter sodium"
            minValue={0}
            maxValue={10000}
            unit="mg"
            onValidationChange={() => {}}
          />
        </View>
      </ScrollView>
    </>
  );
}
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

interface AgeStepProps {
  age: string;
  onAgeChange: (age: string) => void;
}

function AgeStep({ age, onAgeChange }: AgeStepProps) {
  const minAge = 18;
  const maxAge = 120;
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Calculate min and max dates
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());

  // Initialize selectedDate from age prop if it exists
  useEffect(() => {
    if (age) {
      const ageNum = parseInt(age);
      if (!isNaN(ageNum)) {
        const birthYear = today.getFullYear() - ageNum;
        setSelectedDate(new Date(birthYear, today.getMonth(), today.getDate()));
      }
    }
  }, []);

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowPicker(false);
    
    if (date) {
      const calculatedAge = calculateAge(date);
      
      // Validate age range
      if (calculatedAge >= minAge && calculatedAge <= maxAge) {
        setSelectedDate(date);
        onAgeChange(calculatedAge.toString());
      }
    }
  };

  const formatDate = (date: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <>
      <TitleSection
        title="Select your Birthday"
        description="Age affects nutrient intake by changing metabolism, absorption, and dietary needs."
      />

      <InfoCard
        title="Users must only be"
        subtitle={`${minAge} to ${maxAge} years old`}
        editable={false}
      />

      <View style={styles.datePickerContainer}>
  <TouchableOpacity 
    style={styles.dateButton} 
    onPress={() => setShowPicker(true)}
    activeOpacity={0.7}
  >
    <View style={styles.dateButtonContent}>
      <View style={styles.dateTextContainer}>
        <Text style={styles.dateLabel}>Birthday</Text>
        <Text style={[styles.dateValue, !age && styles.datePlaceholder]}>
          {age ? `${formatDate(selectedDate)} (${age} years old)` : 'Select your birthday'}
        </Text>
      </View>
      
      {/* Pencil Icon */}
      <Ionicons name="pencil-outline" size={20} color="#666666" />
      {/* OR for Expo: */}
      {/* <Feather name="edit-2" size={20} color="#666666" /> */}
    </View>
  </TouchableOpacity>

  {showPicker && (
    <DateTimePicker
      value={selectedDate}
      mode="date"
      display={'spinner'}
      onChange={onDateChange}
      maximumDate={maxDate}
      minimumDate={minDate}
      testID="dateTimePicker"
    />
  )}
</View>
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
  datePickerContainer: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  dateButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 70,
    justifyContent: 'center',
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  dateLabel: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 8,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
  },
  datePlaceholder: {
    color: '#666666',
    fontWeight: '400',
  },
  pickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  doneButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // ✅ Updated custom intake styles with ScrollView
  customIntakeScrollView: {
    flex: 1,
  },
  customIntakeContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,  // ✅ Add bottom padding for better scrolling
  },
  inputFieldWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 8,
    fontWeight: '500',
  },
});