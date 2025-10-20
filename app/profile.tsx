import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import SafeViewAndroid from "@/components/SafeViewAndroid";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import AppLogo from "@/components/appLogo";
import BottomNavBar from "@/components/BottomNavBar";
import ProfileField from "@/components/ProfileField";
import ProfileBox from "@/components/ProfileBox";
import TextInputModal from "@/components/TextInputModal";
import GenderSelectionModal from "@/components/GenderSelectionModal";
import WarningModal from "@/components/WarningModal";
import NutrientInputModal from "@/components/NutrientInputModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import NutritionIntakeSection from "@/components/NutritionIntakeSection";
import { fetchNutritionAverage, useNutritionIntakeStore } from "@/stores/nutritionIntakeStore";

import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/config/supabase";
import { useState, useEffect } from "react";

import {
  formatName,
  formatAge,
  formatGender,
  formatHeight,
  formatWeight,
} from "@/utils/profileUtils";

interface UserProfile {
  name?: string;
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
  email?: string;
}

interface NutrientValues {
  avgCarbs: string;
  avgSodium: string;
  avgProtein: string;
  avgCalories: string;
}

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "profile"
>;

export default function Profile() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { isAuthenticated } = useAuthStore();

  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecommendedIntake = fetchNutritionAverage();

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  const [nutrientModalVisible, setNutrientModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);

  // Track which section triggered the warning modal
  const [warningModalSource, setWarningModalSource] = useState<'nutrition' | 'average' | null>(null);

  const [modalConfig, setModalConfig] = useState({
    title: "",
    placeholder: "",
    keyboardType: "default" as "default" | "numeric" | "email-address",
    initialValue: "",
    fieldType: "" as "name" | "age" | "weight" | "height",
  });

  const [nutrientValues, setNutrientValues] = useState<NutrientValues>({
    avgCarbs: "",
    avgSodium: "",
    avgProtein: "",
    avgCalories: "",
  });

  // Add new state to track if user has health condition
  const [hasHealthCondition, setHasHealthCondition] = useState<boolean>(false);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthenticated) {
      navigation.replace("login");
    }
  }, [isAuthenticated, navigation]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: "login" }],
      });
    }
  }, [isAuthenticated, navigation]);

  // Fetch user profile and health condition status
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const { user } = useAuthStore.getState();

      if (!user) {
        console.log("No user found");
        return;
      }

      // First check if user has nutrition intake data
      const { data: nutritionData } = await supabase
        .from("user_nutrition_intake")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // If nutrition data exists, user has health condition
      setHasHealthCondition(!!nutritionData);

      // Get profile data from Supabase
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("name, age, weight, height, gender, email")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        // Fallback to user metadata if profile table fails
        setUserProfile({
          name:
            user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            "No name set",
          age: user.user_metadata?.age,
          weight: user.user_metadata?.weight,
          height: user.user_metadata?.height,
          gender: user.user_metadata?.gender,
          email: user.email,
        });
      } else {
        // Use profile data from database
        setUserProfile({
          name: profile.name || "No name set",
          age: profile.age,
          weight: profile.weight,
          height: profile.height,
          gender: profile.gender,
          email: profile.email || user.email,
        });
        fetchRecommendedIntake.updateNutritionIntakeAve();
        fetchRecommendedIntake.fetchNutritionIntakeAve();
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch current nutrition intake values
  const fetchNutritionIntake = async () => {
    try {
      const { user } = useAuthStore.getState();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_nutrition_intake")
        .select("avg_carbs, avg_sodium, avg_protein, avg_calories")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching nutrition intake:", error);
        // Set default values if no record exists
        setNutrientValues({
          avgCarbs: "",
          avgSodium: "",
          avgProtein: "",
          avgCalories: "",
        });
      } else if (data) {
        setNutrientValues({
          avgCarbs: data.avg_carbs?.toString() || "",
          avgSodium: data.avg_sodium?.toString() || "",
          avgProtein: data.avg_protein?.toString() || "",
          avgCalories: data.avg_calories?.toString() || "",
        });
      }
    } catch (error) {
      console.error("Nutrition intake fetch error:", error);
    }
  };

  // useEffect to load profile data when component mounts:
  useEffect(() => {
    fetchUserProfile();
    fetchNutritionIntake();
  }, []);

  // Validation functions
  const validateAge = (age: number): boolean => {
    return age >= 18 && age <= 120;
  };

  const validateWeight = (weight: number): boolean => {
    return weight >= 40 && weight <= 120;
  };

  const validateHeight = (height: number): boolean => {
    return height >= 140 && height <= 188;
  };

  // Handle modal submission
  const handleModalSubmit = async (value: string) => {
    const { fieldType } = modalConfig;
    const { user } = useAuthStore.getState();

    if (!user) return;

    try {
      let updateData: any = {};
      let numericValue: number;

      switch (fieldType) {
        case "name":
          if (!value.trim()) {
            Alert.alert("Validation Error", "Name cannot be empty.");
            return;
          }
          updateData.name = value.trim();
          break;
        case "age":
          numericValue = Number(value);
          if (isNaN(numericValue) || !validateAge(numericValue)) {
            Alert.alert(
              "Validation Error",
              "Age must be between 18 and 120 years."
            );
            return;
          }
          updateData.age = numericValue;
          break;
        case "weight":
          numericValue = Number(value);
          if (isNaN(numericValue) || !validateWeight(numericValue)) {
            Alert.alert(
              "Validation Error",
              "Weight must be between 40 and 120 kg."
            );
            return;
          }
          updateData.weight = numericValue;
          break;
        case "height":
          numericValue = Number(value);
          if (isNaN(numericValue) || !validateHeight(numericValue)) {
            Alert.alert(
              "Validation Error",
              "Height must be between 140 and 188 cm."
            );
            return;
          }
          updateData.height = numericValue;
          break;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) {
        console.error(`Error updating ${fieldType}:`, error);
        Alert.alert(
          "Check internet connection",
          `Failed to update ${fieldType}. Please try again.`
        );
      } else {
        setModalVisible(false);
        fetchUserProfile();
      }
    } catch (error) {
      console.error(`${fieldType} update error:`, error);
      Alert.alert(
        "Check internet connection",
        `Failed to update ${fieldType}. Please try again.`
      );
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
  };

  // Handle gender modal submission
  const handleGenderSelect = async (gender: "male" | "female") => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ gender })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating gender:", error);
        Alert.alert("Error", "Failed to update gender. Please try again.");
      } else {
        setGenderModalVisible(false);
        fetchUserProfile();
      }
    } catch (error) {
      console.error("Gender update error:", error);
      Alert.alert("Error", "Failed to update gender. Please try again.");
    }
  };

  const handleGenderModalCancel = () => {
    setGenderModalVisible(false);
  };

  // Handle nutrition intake section press
  const handleNutritionIntakePress = () => {
    if (!hasHealthCondition) {
      Alert.alert(
        "Not Available",
        "Custom nutrition intake is only available for users with specific healthcare recommendations.",
        [{ text: "OK" }]
      );
      return;
    }
    setWarningModalSource('nutrition');
    setWarningModalVisible(true);
  };

  const handleAverageIntakePress = () => {
    setWarningModalSource('average');
    setWarningModalVisible(true);
  };

  // Handle confirmation modal for average intake
  const handleConfirmationYes = async () => {
    setConfirmationModalVisible(false);
    const { user } = useAuthStore.getState();
    if (!user) return;

    try {
      console.log("🔄 Switching to API-generated nutrition intake (is_manual: false)");

      // First, set is_manual to false to allow the update
      const { error: updateError } = await supabase
        .from("user_nutrition_intake")
        .update({ is_manual: false })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error setting is_manual to false:", updateError);
        throw new Error("Failed to update nutrition mode");
      }

      console.log("✅ Set is_manual to false, now updating with API values");

      // Now update with API-generated values (this will work since is_manual is now false)
      await fetchRecommendedIntake.updateNutritionIntakeAve();

      // Fetch the updated ranges
      await fetchRecommendedIntake.fetchNutritionIntakeAve();

      // Refresh nutrition intake data to show updated values
      fetchNutritionIntake();

      Alert.alert(
        "Success",
        "Your recommended nutrient intake has been updated based on your demographic data.",        
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error updating recommended intake:", error);
      Alert.alert(
        "Error",
        "Failed to update recommended intake. Please check your internet connection and try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleConfirmationNo = () => {
    setConfirmationModalVisible(false);
  };

  // Handle warning modal confirmation
  const handleWarningConfirm = () => {
    setWarningModalVisible(false);

    // Check which section triggered the warning modal
    if (warningModalSource === 'nutrition') {
      // Show nutrient input modal for custom nutrition intake
      setNutrientModalVisible(true);
    } else if (warningModalSource === 'average') {
      // Show confirmation modal for recommended intake
      setConfirmationModalVisible(true);
    }

    // Reset source
    setWarningModalSource(null);
  };

  const handleWarningCancel = () => {
    setWarningModalVisible(false);
    setWarningModalSource(null);
  };

  // Handle nutrient values submission
  const handleNutrientSubmit = async (values: NutrientValues) => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    try {
      console.log("🔄 Switching to manual nutrition intake (is_manual: true)");

      const updateData = {
        user_id: user.id,
        avg_carbs: parseFloat(values.avgCarbs),
        avg_protein: parseFloat(values.avgProtein),
        avg_sodium: parseFloat(values.avgSodium),
        avg_calories: parseFloat(values.avgCalories),
        is_manual: true, // 🔥 Mark as manually entered
        updated_at: new Date().toISOString(),
      };

      // Use upsert to insert or update
      const { error } = await supabase
        .from("user_nutrition_intake")
        .upsert(updateData, {
          onConflict: "user_id",
        });

      if (error) {
        console.error("Error updating nutrition intake:", error);
        Alert.alert(
          "Error",
          "Failed to update nutrition intake. Please check your internet connection and try again."
        );
      } else {
        setNutrientModalVisible(false);
        setNutrientValues(values);
        Alert.alert(
          "Success",
          "Your daily nutrient intake has been updated successfully. The system will now use your custom values."
        );
        // Refresh nutrition intake data to show manual values
        fetchNutritionIntake();
        fetchRecommendedIntake.fetchNutritionIntakeAve();
      }
    } catch (error) {
      console.error("Nutrient update error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    }
  };

  const handleNutrientCancel = () => {
    setNutrientModalVisible(false);
  };

  const handleEditName = () => {
    setModalConfig({
      title: "Edit Name",
      placeholder: "Enter your name",
      keyboardType: "default",
      initialValue: userProfile.name || "",
      fieldType: "name",
    });
    setModalVisible(true);
  };

  const handleEditAge = () => {
    setModalConfig({
      title: "Edit Age",
      placeholder: "Enter your age",
      keyboardType: "numeric",
      initialValue: userProfile.age?.toString() || "",
      fieldType: "age",
    });
    setModalVisible(true);
  };

  const handleEditWeight = () => {
    setModalConfig({
      title: "Edit Weight",
      placeholder: "Enter your weight (kg)",
      keyboardType: "numeric",
      initialValue: userProfile.weight?.toString() || "",
      fieldType: "weight",
    });
    setModalVisible(true);
  };

  const handleEditHeight = () => {
    setModalConfig({
      title: "Edit Height",
      placeholder: "Enter your height (cm)",
      keyboardType: "numeric",
      initialValue: userProfile.height?.toString() || "",
      fieldType: "height",
    });
    setModalVisible(true);
  };

  const handleEditGender = () => {
    setGenderModalVisible(true);
  };

  // Replace your return statement in Profile.tsx with this:

  return (
    <>
      {/* Main Profile Content */}
      <SafeAreaView style={SafeViewAndroid.AndroidSafeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AppLogo />
          <View style={styles.mainContainer}>
            <View style={styles.profileBoxContainer}>
              <ProfileBox
                primaryText="Personal"
                highlightedText="Profile"
                secondaryText="Information"
                style={styles.customProfileBox}
              />
            </View>

            {/* Profile Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={60} color="#333" />
              </View>
            </View>

            {/* Profile Fields Section */}
            <View style={styles.fieldsContainer}>
              <ProfileField
                label="Name"
                value={isLoading ? "Loading..." : formatName(userProfile.name)}
                onPress={handleEditName}
              />

              <ProfileField
                label="Age"
                value={isLoading ? "Loading..." : formatAge(userProfile.age)}
                onPress={handleEditAge}
              />

              <ProfileField
                label="Weight"
                value={
                  isLoading ? "Loading..." : formatWeight(userProfile.weight)
                }
                onPress={handleEditWeight}
              />

              <ProfileField
                label="Height"
                value={
                  isLoading ? "Loading..." : formatHeight(userProfile.height)
                }
                onPress={handleEditHeight}
              />

              <ProfileField
                label="Gender"
                value={
                  isLoading ? "Loading..." : formatGender(userProfile.gender)
                }
                onPress={handleEditGender}
                style={styles.lastField}
              />
            </View>

            {/* Nutrition Intake Section */}
            <NutritionIntakeSection onPress={handleNutritionIntakePress} />

            {/* Recommended Intake Section */}
            <NutritionIntakeSection
              onPress={handleAverageIntakePress}
              title="Average Nutrient Intake"
              icon="construct-outline"
              description="Generate your DRI recommended intake"
            />
          </View>
        </ScrollView>

        <BottomNavBar
          onCameraPress={() => navigation.navigate("camera")}
          routeMapping={{
            home: "page-2",
            stats: "statistics",
            settings: "settings",
            profile: "profile",
          }}
        />
      </SafeAreaView>

      {/* ✅ Modals rendered OUTSIDE SafeAreaView - This fixes the overlay issue! */}
      <TextInputModal
        visible={modalVisible}
        title={modalConfig.title}
        placeholder={modalConfig.placeholder}
        initialValue={modalConfig.initialValue}
        keyboardType={modalConfig.keyboardType}
        onSubmit={handleModalSubmit}
        onCancel={handleModalCancel}
      />

      <GenderSelectionModal
        visible={genderModalVisible}
        title="Select Gender"
        onSelect={handleGenderSelect}
        onCancel={handleGenderModalCancel}
      />

      {/* Warning Modal - Always rendered (used by both sections) */}
      <WarningModal
        visible={warningModalVisible}
        title="Healthcare Consultation Required"
        message="Changing your daily nutrient intake values should be done under the guidance of a qualified healthcare professional. Have you consulted with a healthcare provider about these changes?"
        onConfirm={handleWarningConfirm}
        onCancel={handleWarningCancel}
      />

      {/* Nutrient Input Modal - Only for users with health condition */}
      {hasHealthCondition && (
        <NutrientInputModal
          visible={nutrientModalVisible}
          title="Edit Nutrient Intake"
          initialValues={nutrientValues}
          onSubmit={handleNutrientSubmit}
          onCancel={handleNutrientCancel}
        />
      )}

      {/* Confirmation Modal for Recommended Intake - Always rendered */}
      <ConfirmationModal
        visible={confirmationModalVisible}
        title="Confirm Changes"
        message="Would you like to update your recommended nutrient intake based on your current profile information?"
        onConfirm={handleConfirmationYes}
        onCancel={handleConfirmationNo}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eff1f6",
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  profileBoxContainer: {
    marginBottom: 20,
  },
  customProfileBox: {
    width: 205,
  },
  container: {
    flex: 1,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fieldsContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  lastField: {
    borderBottomWidth: 0,
  },
  scrollContent: {
    paddingBottom: 100,
  },
});
