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
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import AppLogo from "@/components/appLogo";
import BottomNavBar from "@/components/BottomNavBar";
import ProfileField from "@/components/ProfileField";
import ProfileBox from "@/components/ProfileBox";

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

  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [isLoading, setIsLoading] = useState(true);

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

  const handleEditName = async () => {
    Alert.prompt("Edit Name", "Enter new name.", async (text: string) => {
      await supabase
        .from("profiles")
        .update({
          name: text,
        })
        .eq("email", userProfile.email)
        .select("*");

      fetchUserProfile();
    });
    // Alert.alert("Edit Name", "Name editing functionality not implemented yet.");
  };

  const handleEditAge = () => {
    Alert.prompt("Edit Age", "Enter new age.", async (text: string) => {
      await supabase
        .from("profiles")
        .update({
          age: Number(text),
        })
        .eq("email", userProfile.email)
        .select("*");

      fetchUserProfile();
    });
    // Alert.alert("Edit Age", "Age editing functionality not implemented yet.");
  };

  const handleEditWeight = () => {
    Alert.prompt("Edit Weight", "Enter new weight.", async (text: string) => {
      await supabase
        .from("profiles")
        .update({
          weight: Number(text),
        })
        .eq("email", userProfile.email)
        .select("*");

      fetchUserProfile();
    });

    // Alert.alert(
    //   "Edit Weight",
    //   "Weight editing functionality not implemented yet."
    // );
  };

  const handleEditHeight = () => {
    Alert.prompt("Edit Height", "Enter new height.", async (text: string) => {
      await supabase
        .from("profiles")
        .update({
          height: Number(text),
        })
        .eq("email", userProfile.email)
        .select("*");

      fetchUserProfile();
    });

    // Alert.alert(
    //   "Edit Height",
    //   "Height editing functionality not implemented yet."
    // );
  };

  const handleEditGender = () => {
    Alert.alert(
      "Edit Gender",
      "Gender editing functionality not implemented yet."
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
        activeTab="profile"
        onTabPress={handleTabPress}
        onCameraPress={() => navigation.navigate("camera")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  profileBoxContainer: {
    marginBottom: 20,
  },
  customProfileBox: {
    width: 240, // Wider for "Personal Profile Information"
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
