import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import SafeViewAndroid from '@/components/SafeViewAndroid';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/types';
import { Ionicons } from '@expo/vector-icons';
import AppLogo from '@/components/appLogo';
import BottomNavBar from '@/components/BottomNavBar';
import SettingsSection from '@/components/SettingsSection';
import SettingsItem from '@/components/SettingsItem';
import ToggleSwitch from '@/components/ToggleSwitch';
import ProfileBox from '@/components/ProfileBox';
import FullTextModal from '@/components/FullTextModal';
import { useAuthStore } from '@/stores/authStore';
import ResetPasswordModal from "@/components/ResetPasswordModal";

type SettingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "settings"
>;

export default function Settings() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { signOut, isAuthenticated } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false); 

  

  const handleChangePassword = () => {
    setShowResetPasswordModal(true);
  };

  const handleAppVersion = () => {
    Alert.alert("App Version", "NutriVision v1.0.0");
  };

  const handleContactSupport = () => {
    Alert.alert(
      "Contact Support",
      "Please contact support via email: nutrixtract@gmail.com",
      [{ text: "OK", style: "default" }]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          // In Settings screen, replace the logout onPress:
          onPress: async () => {
            try {
              await signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'login' }],
              });
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  

  const handleTermsAndConditions = () => {
    setShowTermsModal(true);
  };

  const handlePrivacyPolicy = () => {
    setShowPrivacyModal(true);
  };

  const handleDisclaimer = () => {
    setShowDisclaimerModal(true);
  };

  return (
    <SafeAreaView style={SafeViewAndroid.AndroidSafeArea}>
      <AppLogo />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContainer}>
          <View style={styles.profileBoxContainer}>
            <ProfileBox
              primaryText="Settings"
              highlightedText="&"
              secondaryText="Preferences"
              style={styles.customProfileBox}
            />
          </View>

          <SettingsSection title="Privacy and Security">
            <SettingsItem
              title="Change Password"
              onPress={handleChangePassword}
            />
            <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
              <View style={styles.rightSection}>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
            </TouchableOpacity>
          </SettingsSection>

          <SettingsSection title="Notifications">
            <SettingsItem
              title="Notifications"
              showChevron={false}
              rightComponent={
                <ToggleSwitch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              }
            />
          </SettingsSection>

          <SettingsSection title="Support">
            <SettingsItem title="App Version" onPress={handleAppVersion} />
            <SettingsItem
              title="Contact Support"
              onPress={handleContactSupport}
            />
          </SettingsSection>

          <SettingsSection title="Legal">
            <SettingsItem
              title="Terms and Conditions"
              onPress={handleTermsAndConditions}
            />
            <SettingsItem
              title="Privacy Policy"
              onPress={handlePrivacyPolicy}
            />
            <SettingsItem
              title="Disclaimer"
              onPress={handleDisclaimer}
              style={styles.lastItem}
            />
          </SettingsSection>
        </View>
      </ScrollView>

      <BottomNavBar
        onCameraPress={() => navigation.navigate("camera")}
        routeMapping={{
          home: "page-2",
          stats: "statistics", 
          settings: "settings",
          profile: "profile"
        }}
      />

      {/* Modals */}
      <FullTextModal
        visible={showTermsModal}
        type="terms"
        onClose={() => setShowTermsModal(false)}
      />

      <FullTextModal
        visible={showPrivacyModal}
        type="privacy"
        onClose={() => setShowPrivacyModal(false)}
      />

      <FullTextModal
        visible={showDisclaimerModal}
        type="disclaimer"
        onClose={() => setShowDisclaimerModal(false)}
      />

      <ResetPasswordModal
        visible={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
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
    paddingTop: 16,
  },
  profileBoxContainer: {
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  customProfileBox: {
    width: 180, // Wider for "Settings & Preferences"
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Add padding to prevent content hiding under navigation bar
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    fontSize: 16,
    color: "#E74C3C", // Red color for logout
    fontFamily: "AlbertSans-Medium",
    flex: 1,
  },
  logoutItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
