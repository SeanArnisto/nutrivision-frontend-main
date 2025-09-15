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

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "profile"
>;

export default function Profile() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { isAuthenticated } = useAuthStore();

  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    placeholder: "",
    keyboardType: "default" as "default" | "numeric" | "email-address",
    initialValue: "",
    fieldType: "" as "name" | "age" | "weight" | "height",
  });

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthenticated) {
      navigation.replace("login");
    }
  }, [isAuthenticated, navigation]);

  const handleTabPress = (tabName: string) => {
    switch (tabName) {
      case "home":
        navigation.navigate("page-2");
        break;
      case "stats":
        navigation.navigate("statistics");
        break;
      case "settings":
        navigation.navigate("settings");
        break;
      case "profile":
        // Already on profile page
        break;
    }
  };

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const { user } = useAuthStore.getState();

      if (!user) {
        console.log("No user found");
        return;
      }

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
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect to load profile data when component mounts:
  useEffect(() => {
    fetchUserProfile();
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
          "Error",
          `Failed to update ${fieldType}. Please try again.`
        );
      } else {
        setModalVisible(false);
        fetchUserProfile();
      }
    } catch (error) {
      console.error(`${fieldType} update error:`, error);
      Alert.alert("Error", `Failed to update ${fieldType}. Please try again.`);
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

  return (
    <SafeAreaView style={SafeViewAndroid.AndroidSafeArea}>
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

        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>
      </View>

      <BottomNavBar
        onCameraPress={() => navigation.navigate("camera")}
        routeMapping={{
          home: "page-2",
          stats: "statistics",
          settings: "settings",
          profile: "profile",
        }}
      />

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
    </SafeAreaView>
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
    width: 200, // Wider for "Personal Profile Information"
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
    marginHorizontal: 0, // Removed marginHorizontal as it's now in mainContainer
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
    marginBottom: 120, // Extra space for bottom nav
  },
  lastField: {
    borderBottomWidth: 0,
  },
});
