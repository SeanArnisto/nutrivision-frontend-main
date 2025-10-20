import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  Text,
  TouchableOpacity,
  ScrollView,
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
import { Ionicons } from "@expo/vector-icons";
import CalorieCard from "@/components/CalorieCard";
import BMICard from "@/components/BMICard";
import BMIModal from "@/components/BMIModal";




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
import CustomModal from "@/components/customModal";
import { Custom } from "react-native-reanimated-carousel/lib/typescript/components/Pagination/Custom";
import { withDecay } from "react-native-reanimated";
import { useUserProfileStore } from "@/stores/userProfileStore";




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
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [bmiModalVisible, setBmiModalVisible] = useState(false);


  // Use the auth store to get user info
  const { user, isAuthenticated, profileComplete } = useAuthStore();
  const [isVisible, setIsVisible] = useState<boolean>(false);

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


  const {
  profile,
  fetchUserProfile,
  calculateBMI,
} = useUserProfileStore();

useEffect(() => {
  if (isAuthenticated && user) {
    fetchUserProfile();
  }
}, [isAuthenticated, user, fetchUserProfile]);



const userBMI = calculateBMI();
const userWeight = profile?.weight ?? 0;
const userHeight = profile?.height ?? 0;

useEffect(() => {
  if (!isProfileLoading) {
    console.log("✅ Profile loaded - BMI:", userBMI, "Weight:", userWeight, "Height:", userHeight);
  }
}, [userBMI, isProfileLoading, userWeight, userHeight]);

  // Fetch nutrition intake data on component mount
  // Fetch nutrition intake data on component mount
useEffect(() => {
  if (isAuthenticated && user && profileComplete === true) {
    console.log("🏠 Home page: Fetching nutrition intake...");
    fetchNutritionIntake().then(() => {
      console.log("📊 Nutrition data loaded:", nutritionData);
    });
  }
}, [isAuthenticated, user, profileComplete, fetchNutritionIntake]);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: "login" }],
      });
    }
  }, [isAuthenticated, navigation]);

  useEffect(() => {
    if (isAuthenticated && profileComplete === false) {
      navigation.replace("onboarding");
    }
  }, [isAuthenticated, profileComplete, navigation]);

  // Don't render anything if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }








  // Check if any of the errors are network-related
  // useEffect(() => {
  //   const hasNetworkError = (error: string | null) => {
  //     return (
  //       error &&
  //       (error.toLowerCase().includes("network request failed") ||
  //         error.toLowerCase().includes("network error") ||
  //         error.toLowerCase().includes("connection failed") ||
  //         error.toLowerCase().includes("fetch failed"))
  //     );
  //   };

  //   // Only check the error variable you actually have
  //   if (hasNetworkError(intakeError) && !shouldRedirect) {
  //     console.log(
  //       "Network error detected in Statistics, redirecting to Page2..."
  //     );
  //     setShouldRedirect(true);
  //     setTimeout(() => {
  //       navigation.navigate("page-2");
  //     }, 1000);
  //   }
  // }, [intakeError, navigation, shouldRedirect]);

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
    // Calories average (fallback to 0 if not available)
    const caloriesAvg = nutritionData?.avg_calories
      ? Math.round(nutritionData.avg_calories)
      : 0;
    // const bmiValue = 35;
    // Handle retry for different er  rors
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
      <ScrollView style={styles.down}>
      <AppLogo />
      <ThemedView style={styles.container}>
        <View style={styles.headerContainer}>
          <ProfileBox
            primaryText="Average"
            highlightedText="Daily"
            secondaryText="Intake"
            style={{width: 165}}
          />
          <TouchableOpacity onPress={() => setIsVisible(true)}>
            <Ionicons
              name="information-circle-outline"
              size={28}
              color="#9AB206"
            />
          </TouchableOpacity>
        </View>

        <CustomModal
          visible={isVisible}
          onClose={() => setIsVisible(false)}
          title="Average Daily Intake"
        >
          <View>
            <Text>
              {"\n"}This screen displays your average daily intake. {"\n\n"}The values shown
              for carbohydrates, sodium, and protein (in grams) {"\n\n"}Represent your
              maximum daily threshold, which is customized based on your weight,
              height, and age.{"\n\n"}The calendar below allows you to track daily intake, it displays
              the intake for a specific day at a given time.
              
            </Text>
          </View>
        </CustomModal>
          {/* Calorie Card - Full Width */}
          <CalorieCard
            value={isIntakeLoading ? "..." : caloriesAvg.toString()}
            fill={100}
            maxCalories={2000} // Optional: pass user's target calories
          />
        <View style={styles.rowContainer}>
        
          {/* Carbohydrate Card */}
          <AvgIntakeCard
            iconSource={nutrients.carbohydrate.icon}
            tintColor={nutrients.carbohydrate.tintColor}
            subtitle="Carbohydrate"
            value={isIntakeLoading ? "..." : carbAvg.toString()}
            index={0}
          />

          {/* Sodium Card */}
          <AvgIntakeCard
            iconSource={nutrients.sodium.icon}
            tintColor={nutrients.sodium.tintColor}
            subtitle="Sodium"
            value={isIntakeLoading ? "..." : sodiumAvg.toString()}
            index={1}
          />

          {/* Protein Card */}
          <AvgIntakeCard
            iconSource={nutrients.protein.icon}
            tintColor={nutrients.protein.tintColor}
            subtitle="Protein"
            value={isIntakeLoading ? "..." : proteinAvg.toString()}
            index={2}
          />
        </View>
        {/* BMI Card */}
<BMICard
  bmiValue={isProfileLoading ? 0 : Math.round(userBMI || 0)}
  onInfoPress={() => setBmiModalVisible(true)}
/>
      {/* Show loading skeleton while fetching profile */}
{isProfileLoading && (
  <View style={styles.skeletonContainer}>
    <Text style={styles.skeletonText}>Loading profile...</Text>
  </View>
)}

{/* Show error if fetch fails */}
{profileError && (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>
      Error loading profile: {profileError}
    </Text>
  </View>
)}
        {/* Error handling for nutrition intake */}
        {intakeError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Error loading nutrition intake: Check Internet Connectivity
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
              Error loading calendar data: Check Internet Connectivity
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
<BMIModal
  visible={bmiModalVisible}
  onClose={() => setBmiModalVisible(false)}
  bmiValue={isProfileLoading ? 0 : Math.round(userBMI || 0)}
  weight={userWeight}
  height={userHeight}
/>
    </SafeAreaView>
    
    
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eff1f6",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  down:{
    marginBottom: 60,
  },

  skeletonContainer: {
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60,
  },
  skeletonText: {
    fontSize: 14,
    color: "#666666",
    fontStyle: "italic",
  },
  
});
