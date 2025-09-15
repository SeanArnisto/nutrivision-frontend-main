import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  Text,
  TouchableOpacity,
} from "react-native";
import SafeViewAndroid from "@/components/SafeViewAndroid";
import { ThemedView } from "@/components/ThemedView";
import "react-circular-progressbar/dist/styles.css";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import AvgIntakeCard from "@/components/avgIntakeCard";
import { nutrients } from "@/constants/nutrientIcons";
import AppLogo from "@/components/appLogo";
import ProfileBox from "@/components/ProfileBox";
import BottomNavBar from "@/components/BottomNavBar";
import Calendar from "@/components/Calendar";
import DateDetailModal from "@/components/DateDetailModal";
import SessionDetailModal from "@/components/SessionDetailModal";

// Import the hooks and auth store
import {
  useNutritionCalendar,
  Session,
  FoodEntry,
  NutritionSummary,
} from "@/hooks/useNutritionCalendar";
import { useAuthStore } from "@/stores/authStore";
import { useNutritionIntakeStore } from "@/stores/nutritionIntakeStore";
import { useAccountCreationDate } from "@/hooks/useAccountCreationDate";

type Page2ScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "page-2"
>;

export default function Page2() {
  const navigation = useNavigation<Page2ScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState("home");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionFoodEntries, setSessionFoodEntries] = useState<FoodEntry[]>([]);

  // Use the auth store to get user info
  const { user, isAuthenticated } = useAuthStore();

  // Use the nutrition calendar hook
  const {
    sessionsData,
    isLoading: isCalendarLoading,
    error: calendarError,
    getSessionsForDate,
    getFoodEntriesForSession,
    getNutritionSummaryForSession,
    refreshData,
  } = useNutritionCalendar();

  // Use the correct nutrition intake hook for average intake cards
  const {
    nutritionData,
    isLoading: isIntakeLoading,
    error: intakeError,
    fetchNutritionIntake,
  } = useNutritionIntakeStore();

  // Use the account creation date hook
  const {
    accountCreationDate,
    isLoading: isProfileLoading,
    error: profileError,
  } = useAccountCreationDate();

  // Fetch nutrition intake data on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNutritionIntake();
    }
  }, [isAuthenticated, user, fetchNutritionIntake]);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthenticated) {
      navigation.replace("login");
    }
  }, [isAuthenticated, navigation]);

  // Don't render anything if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const handleTabPress = (tabName: string) => {
    if (tabName === activeTab) {
      navigation.replace("page-2");
    } else {
      setActiveTab(tabName);
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
          navigation.navigate("profile");
          break;
      }
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setDateModalVisible(true);
    console.log("Selected date:", date.toDateString());
  };

  const handleModalClose = () => {
    setDateModalVisible(false);
    setSelectedDate(null);
  };

  const handleSessionSelect = (session: any) => {
    try {
      setSelectedSession(session);
      setDateModalVisible(false);
      setSessionModalVisible(true);

      // Fetch food entries for the selected session asynchronously
      getFoodEntriesForSession(session.id)
        .then((foodEntries) => {
          setSessionFoodEntries(foodEntries);
        })
        .catch((error) => {
          console.error("Error loading session details:", error);
          setSessionFoodEntries([]);
        });
    } catch (error) {
      console.error("Error loading session details:", error);
    }
  };

  const handleSessionModalClose = () => {
    setSessionModalVisible(false);
    setSelectedSession(null);
    setSessionFoodEntries([]);
  };

  // Get sessions for the selected date
  const getSessionsForSelectedDate = (): Session[] => {
    if (!selectedDate) return [];
    return getSessionsForDate(selectedDate);
  };

  // Get nutrition summary for selected session
  const getSelectedSessionNutritionSummary = (): NutritionSummary | null => {
    if (!selectedSession) return null;
    return getNutritionSummaryForSession(selectedSession.id);
  };

  // Calculate averages from nutrition intake data (from user_nutrition_intake table)
  const carbAvg = nutritionData?.avg_carbs
    ? Math.round(nutritionData.avg_carbs)
    : 0;
  const proteinAvg = nutritionData?.avg_protein
    ? Math.round(nutritionData.avg_protein)
    : 0;
  const sodiumAvg = nutritionData?.avg_sodium
    ? nutritionData.avg_sodium / 1000
    : 0; // No division by 1000 if already in correct units

  // Handle retry for different errors
  const handleRetry = (type: "calendar" | "intake") => {
    switch (type) {
      case "calendar":
        refreshData();
        break;
      case "intake":
        fetchNutritionIntake();
        break;
    }
  };

  return (
    <SafeAreaView style={SafeViewAndroid.AndroidSafeArea}>
      <AppLogo />
      <ThemedView style={styles.container}>
        <ProfileBox
          primaryText="Average"
          highlightedText="Daily"
          secondaryText="Intake"
        />

        <View style={styles.rowContainer}>
          {/* Carbohydrate Card */}
          <AvgIntakeCard
            iconSource={nutrients.carbohydrate.icon}
            tintColor={nutrients.carbohydrate.tintColor}
            subtitle="Carbohydrate"
            value={isIntakeLoading ? "..." : carbAvg.toString()}
          />

          {/* Sodium Card */}
          <AvgIntakeCard
            iconSource={nutrients.sodium.icon}
            tintColor={nutrients.sodium.tintColor}
            subtitle="Sodium"
            value={isIntakeLoading ? "..." : sodiumAvg.toString()}
          />

          {/* Protein Card */}
          <AvgIntakeCard
            iconSource={nutrients.protein.icon}
            tintColor={nutrients.protein.tintColor}
            subtitle="Protein"
            value={isIntakeLoading ? "..." : proteinAvg.toString()}
          />
        </View>

        {/* Error handling for nutrition intake */}
        {intakeError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Error loading nutrition intake: {intakeError}
            </Text>
            <TouchableOpacity
              onPress={() => handleRetry("intake")}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error handling for calendar */}
        {calendarError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Error loading calendar data: {calendarError}
            </Text>
            <TouchableOpacity
              onPress={() => handleRetry("calendar")}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Calendar Component */}
        <Calendar
          onDateSelect={handleDateSelect}
          sessionsData={sessionsData}
          accountCreationDate={accountCreationDate || new Date()}
        />

        {/* Date Detail Modal */}
        <DateDetailModal
          visible={dateModalVisible}
          onClose={handleModalClose}
          selectedDate={selectedDate}
          sessions={getSessionsForSelectedDate()}
          onSessionSelect={handleSessionSelect}
        />

        {/* Session Detail Modal */}
        <SessionDetailModal
          visible={sessionModalVisible}
          onClose={handleSessionModalClose}
          session={selectedSession}
          foodEntries={sessionFoodEntries}
          nutritionSummary={
            getSelectedSessionNutritionSummary() || {
              carbs: 0,
              sodium: 0,
              protein: 0,
              total: 0,
            }
          }
        />
      </ThemedView>

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
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eff1f6",
  },
  container: {
    flex: 1,
    backgroundColor: "#eff1f6",
    gap: 15,
    padding: 15,
    paddingBottom: 100,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 7,
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  errorText: {
    fontSize: 14,
    color: "#c62828",
    textAlign: "center",
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});
