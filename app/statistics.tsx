import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from "react-native";
import SafeViewAndroid from "@/components/SafeViewAndroid";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import AppLogo from "@/components/appLogo";
import BottomNavBar from "@/components/BottomNavBar";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import ProfileBox from "@/components/ProfileBox";
import { format, addDays } from "date-and-time";
import BarChart from "@/components/Barchart";
import {
  useNutritionIntakeStore,
  useNutritionAverage,
} from "@/stores/nutritionIntakeStore";
import { useAuthStore } from "@/stores/authStore";
import { getNutritionalHistory } from "@/hooks/store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type StatisticsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "statistics"
>;

interface NutrientCardProps {
  value: number;
  target: number;
  label: string;
  unit: string;
  iconSource: any;
  status: "low" | "recommended" | "high";
  index?: number;
}

function NutrientCard({
  value,
  target,
  label,
  unit,
  iconSource,
  status,
  index = 0,
}: NutrientCardProps) {
  // Calculate staggered delay for animations
  const animationDelay = 200 + (index * 150);
  
  // Shorter duration on Android for better performance
  const animationDuration = Platform.OS === 'android' ? 600 : 800;
  
  const getStatusColor = () => {
    switch (status) {
      case "low":
        return "#C0C0C0";
      case "recommended":
        return "#9AB106";
      case "high":
        return "#E74C3C";
      default:
        return "#C0C0C0";
    }
  };

  const percentage = Math.min((value / target) * 100, 100);

  // Format values to 3 decimal places for sodium, round for others
  const formatValue = (val: number) => {
    if (label === "Sodium") {
      return Math.ceil(val * 1000) / 1000; // Round up to 3 decimal places
    }
    return Math.round(val);
  };

  const formatTarget = (val: number) => {
    if (label === "Sodium") {
      return Math.ceil(val * 1000) / 1000; // Round up to 3 decimal places
    }
    return Math.round(val);
  };

  return (
    <View style={styles.nutrientCard}>
      <Text style={styles.nutrientValue}>
        {formatValue(value)}
        {unit}
        <Text style={styles.nutrientTarget}>
          {"\n"}/{formatTarget(target)}
          {unit}
        </Text>
      </Text>
      <Text style={styles.nutrientLabel}>{label}</Text>

       <View style={styles.circularProgressContainer}>
         <AnimatedCircularProgress
           size={80}
           width={6}
           fill={percentage}
           tintColor={getStatusColor()}
           backgroundColor="#DDDDDD"
           lineCap="round"
           duration={animationDuration}
           delay={animationDelay}
           prefill={0}
         >
           {() => <Image source={iconSource} style={styles.nutrientIcon} />}
         </AnimatedCircularProgress>
       </View>
    </View>
  );
}

interface NutritionalRecord {
  id: string;
  user_id: string;
  calories?: number;
  carbohydrates?: number;
  protein?: number;
  sodium?: number;
  created_at: string;
  nutritional_images?: Array<{
    image_url: string;
    image_order: number;
  }>;
}

export default function Statistics() {
  const navigation = useNavigation<StatisticsScreenNavigationProp>();

  // const [nutritionalData, setNutritionalData] = useState<NutritionalRecord[]>(
  //   []
  // );
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  const {
  nutritionalHistory = [],
  isHistoryLoading = false,
  historyError = null,
  fetchNutritionalHistory,
} = useNutritionIntakeStore();

  const handleTabPress = (tabName: string) => {
    switch (tabName) {
      case "home":
        navigation.navigate("page-2");
        break;
      case "stats":
        // Already on statistics page
        break;
      case "settings":
        navigation.navigate("settings");
        break;
      case "profile":
        navigation.navigate("profile");
        break;
    }
  };

  const { user, isAuthenticated } = useAuthStore();

  // Fix: Use the helper hook instead of the store directly
  const {
    nutritionDataAve,
    isLoading: averageLoading,
    error: averageError,
    fetchNutritionIntakeAve,
    hasNutritionData: hasAverageData,
  } = useNutritionAverage();

  // Fix: Proper useEffect for fetching average data
  // useEffect(() => {
  //   if (!hasAverageData && !averageLoading && isAuthenticated && user) {
  //     fetchNutritionIntakeAve();
  //   }
  // }, [
  //   fetchNutritionIntakeAve,
  //   hasAverageData,
  //   averageLoading,
  //   isAuthenticated,
  //   user,
  // ]);

  const {
    // nutrition fetching constant
    nutritionData,
    error: intakeError,
    fetchNutritionIntake,
  } = useNutritionIntakeStore();

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

  // Fetch nutrition intake data on component mount
  // useEffect(() => {
  //   if (isAuthenticated && user) {
  //     fetchNutritionIntake();
  //   }
  // }, [isAuthenticated, user, fetchNutritionIntake]);

  const carbAvg = nutritionData?.avg_carbs
    ? Math.round(nutritionData.avg_carbs)
    : 0;
  const proteinAvg = nutritionData?.avg_protein
    ? Math.round(nutritionData.avg_protein)
    : 0;
  const sodiumAvg = nutritionData?.avg_sodium
    ? nutritionData.avg_sodium / 1000
    : 0; // No division by 1000 if already in correct units

    useEffect(() => {
  // Only fetch if we don't have data and we're authenticated
  if (
    nutritionalHistory.length === 0 && 
    !isHistoryLoading && 
    !historyError &&
    isAuthenticated && 
    user &&
    fetchNutritionalHistory
  ) {
    console.log('Fetching nutritional history as fallback...');
    fetchNutritionalHistory(30);
  }
}, [nutritionalHistory.length, isHistoryLoading, historyError, isAuthenticated, user, fetchNutritionalHistory]);
  // Fetch user nutrition input (30 days)
  // useEffect(() => {
  //   const fetchNutritionHistory = async () => {
  //     setLoading(true);
  //     setError(null);

  //     try {
  //       const result = await getNutritionalHistory(30);

  //       if (result.success) {
  //         setNutritionalData(result.data || []);
  //       } else {
  //         setError(result.error || "Failed to load nutritional data");
  //       }
  //     } catch (err) {
  //       setError(err instanceof Error ? err.message : "Unknown error occurred");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   // Actually call the function
  //   fetchNutritionHistory();
  // }, []);

  const getTodaysRecords = () => {
  if (!nutritionalHistory || !Array.isArray(nutritionalHistory)) {
    return [];
  }
  
  const today = new Date().toDateString();
  return nutritionalHistory.filter(
    (record) => record && record.created_at && new Date(record.created_at).toDateString() === today
  );
};

  const getWeeklyRecords = () => {
  if (!nutritionalHistory || !Array.isArray(nutritionalHistory)) {
    return [];
  }
  
  const startTimestamp = startOfWeek.getTime();
  const endTimestamp = endOfWeek.getTime() + (24 * 60 * 60 * 1000 - 1);

  return nutritionalHistory.filter((record) => {
    if (!record || !record.created_at) return false;
    const recordDate = new Date(record.created_at).getTime();
    return recordDate >= startTimestamp && recordDate <= endTimestamp;
  });
};

  const weeklyNutritionTotal = () => {
    // total util to get total of 3 nutrients from weekly inputs
    const weeklyRecords = getWeeklyRecords();

    return weeklyRecords.reduce(
      (totals, record) => ({
        carbohydrates: totals.carbohydrates + (record.carbohydrates || 0),
        protein: totals.protein + (record.protein || 0),
        sodium: totals.sodium + (record.sodium || 0),
      }),
      { carbohydrates: 0, protein: 0, sodium: 0 }
    );
  };

  const todaysNutritionTotal = () => {
    // total util to get total of 3 nutrients from todays inputs
    const todaysRecord = getTodaysRecords();

    return todaysRecord.reduce(
      (totals, record) => ({
        carbohydrates: totals.carbohydrates + (record.carbohydrates || 0),
        protein: totals.protein + (record.protein || 0),
        sodium: totals.sodium + (record.sodium || 0),
      }),
      { carbohydrates: 0, protein: 0, sodium: 0 }
    );
  };

  // Initialize date constants first
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const startOfWeek = new Date(today); // Create a new date object
  startOfWeek.setDate(today.getDate() - dayOfWeek); // Set to start of week
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  // Format dates for display
  const startStr = format(startOfWeek, "MMM DD");
  const endStr =
    startOfWeek.getMonth() !== endOfWeek.getMonth()
      ? format(endOfWeek, "MMM DD")
      : format(endOfWeek, "DD");

  const todaysNutrition = todaysNutritionTotal();

  // Fix: Complete status determination functions
  const getNutrientStatus = (
    value: number,
    min: number,
    max: number
  ): "low" | "recommended" | "high" => {
    if (value < min) return "low";
    if (value > max) return "high";
    return "recommended";
  };

  // Fix: Use average data for status determination
  const carbsStatus = nutritionDataAve
    ? getNutrientStatus(
        todaysNutrition.carbohydrates,
        nutritionDataAve.minCarbs,
        nutritionDataAve.maxCarbs
      )
    : "low";

  const proteinStatus = nutritionDataAve
    ? getNutrientStatus(
        todaysNutrition.protein,
        nutritionDataAve.minProtein,
        nutritionDataAve.maxProtein
      )
    : "low";

  const sodiumStatus = nutritionDataAve
    ? getNutrientStatus(
        todaysNutrition.sodium * 1000,
        nutritionDataAve.minSodium,
        nutritionDataAve.maxSodium
      )
    : "low";

  // Sample data matching the design
  const nutrientData = [
    {
      value: todaysNutrition.carbohydrates,
      target: carbAvg,
      label: "Carbs",
      unit: "g",
      iconSource: require("@/assets/images/Carbohydrate Icon.png"),
      status: carbsStatus,
    },
    {
      value: todaysNutrition.sodium,
      target: sodiumAvg,
      label: "Sodium",
      unit: "g",
      iconSource: require("@/assets/images/Sodium Icon.png"),
      status: sodiumStatus,
    },
    {
      value: todaysNutrition.protein,
      target: proteinAvg,
      label: "Protein",
      unit: "g",
      iconSource: require("@/assets/images/Protein Icon.png"),
      status: proteinStatus,
    },
  ];

  // Function to get nutrition totals for a specific date
  const getDailyNutritionTotals = (date: Date | null) => {
  try {
    if (!date) {
      console.warn("Invalid date provided to getDailyNutritionTotals");
      return { carbohydrates: 0, protein: 0, sodium: 0 };
    }

    const targetDate = new Date(date).toDateString();

    if (!nutritionalHistory || !Array.isArray(nutritionalHistory)) {
      console.warn("No nutritional data available");
      return { carbohydrates: 0, protein: 0, sodium: 0 };
    }

    const dayRecords = nutritionalHistory.filter((record) => {
      try {
        return (
          record &&
          record.created_at &&
          new Date(record.created_at).toDateString() === targetDate
        );
      } catch (e) {
        console.warn("Invalid record date:", record?.created_at);
        return false;
      }
    });

    return dayRecords.reduce(
      (totals, record) => ({
        carbohydrates:
          totals.carbohydrates + (Number(record?.carbohydrates) || 0),
        protein: totals.protein + (Number(record?.protein) || 0),
        sodium: totals.sodium + (Number(record?.sodium) || 0),
      }),
      { carbohydrates: 0, protein: 0, sodium: 0 }
    );
  } catch (error) {
    console.error("Error in getDailyNutritionTotals:", error);
    return { carbohydrates: 0, protein: 0, sodium: 0 };
  }
};
  // Generate data for each day of the week
  const generateWeeklyChartData = () => {
    try {
      const days = ["S", "M", "T", "W", "TH", "F", "S"];
      const chartData = [];

      if (!startOfWeek) {
        console.warn("startOfWeek is not defined");
        return [];
      }

      // Get recommended values from nutrition store
      const recommendedCarbs = carbAvg || 0;
      const recommendedProtein = proteinAvg || 0;
      const recommendedSodium = sodiumAvg || 0;

      for (let i = 0; i < 7; i++) {
        let currentDate;
        try {
          currentDate = addDays(startOfWeek, i);
        } catch (e) {
          console.warn(`Error adding days to startOfWeek: ${e}`);
          currentDate = new Date();
        }

        const dailyTotals = getDailyNutritionTotals(currentDate);

        // Ensure values are numbers and non-negative
        const safeValue = (val: number) => Math.max(0, Number(val) || 0);

        // Calculate ratios (multiply by 100 to match the 100 = ratio of 1 scale)
        const carbsRatio = recommendedCarbs
          ? (safeValue(dailyTotals.carbohydrates) / recommendedCarbs) * 100
          : 0;
        const sodiumRatio = recommendedSodium
          ? (safeValue(dailyTotals.sodium) / recommendedSodium) * 100
          : 0;
        const proteinRatio = recommendedProtein
          ? (safeValue(dailyTotals.protein) / recommendedProtein) * 100
          : 0;

        // Add carbohydrates bar
        chartData.push({
          value: carbsRatio,
          frontColor: "#F4D03F", // Carbs - Yellow
          spacing: 2,
          label: days[i] || "",
        });

        // Add sodium bar
        chartData.push({
          value: sodiumRatio,
          frontColor: "#8B4513", // Sodium - Brown
        });

        // Add protein bar
        chartData.push({
          value: proteinRatio,
          frontColor: "#9AB106", // Protein - Green
          spacing: i < 6 ? 12 : 0, // Increased spacing between days
        });
      }

      return chartData;
    } catch (error) {
      console.error("Error in generateWeeklyChartData:", error);
      return [];
    }
  };

  // Weekly data for the bar chart using actual values
  const weeklyChartData = generateWeeklyChartData();

  // Show loading state if either average or intake data is loading
  // if (averageLoading || loading) {
  //   return (
  //     <SafeAreaView style={styles.safeArea}>
  //       <View style={styles.loadingContainer}>
  //         <Text>Loading nutrition data...</Text>
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

  // Show error state if there's an error
  if (averageError || historyError) {
    return (
      <SafeAreaView style={SafeViewAndroid.AndroidSafeArea}>
        <View style={styles.errorContainer}>
          <Text>Error: {averageError || historyError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={SafeViewAndroid.AndroidSafeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <AppLogo />

        <View style={styles.mainContainer}>
          <View style={styles.profileBoxContainer}>
            <ProfileBox
              primaryText="Your"
              highlightedText="Statistics"
              secondaryText="Overview"
              style={styles.customProfileBox}
            />
          </View>

          {/* Daily Nutrition Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Daily Nutrition Summary</Text>
              <Text style={styles.summaryDate}>
                {format(today, "MMM DD, YYYY")}
              </Text>

              {/* Legend */}
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#C0C0C0" }]}
                  />
                  <Text style={styles.legendText}>Low Intake</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#9AB106" }]}
                  />
                  <Text style={styles.legendText}>Guidline Intake</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: "#E74C3C" }]}
                  />
                  <Text style={styles.legendText}>High Intake</Text>
                </View>
              </View>
            </View>
          </View>

           {/* Nutrient Cards */}
           <View style={styles.nutrientCardsContainer}>
             {nutrientData.map((nutrient, index) => (
               <NutrientCard
                 key={index}
                 value={nutrient.value}
                 target={nutrient.target}
                 label={nutrient.label}
                 unit={nutrient.unit}
                 iconSource={nutrient.iconSource}
                 status={nutrient.status}
                 index={index}
               />
             ))}
           </View>

          {/* Weekly Chart using the new BarChart component */}
          <BarChart
            key={`chart-${startStr}-${endStr}`}
            data={weeklyChartData}
            title="Weekly Intake Ratio"
            subtitle={`${startStr} - ${endStr}`}
            maxValue={150} // Maximum value on Y-axis
            stepValue={25} // Steps of 25 (0.25 ratio increments)
            height={160}
            barWidth={8}
            spacing={2}
            showLegend={true}
            referenceLine={100} // Add constant reference line at 100%
            referenceLineColor="#000000" // Black line for reference
            legendData={[
              { color: "#F4D03F", label: "Carbohydrates" },
              { color: "#8B4513", label: "Sodium" },
              { color: "#9AB106", label: "Protein" },
              { color: "#000000", label: "Target" },
            ]}
          />
        </View>
      </ScrollView>

      <BottomNavBar
        activeTab="stats"
        onTabPress={handleTabPress}
        onCameraPress={() => navigation.navigate("camera")}
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
    width: 185, // Wider to accommodate "Your Statistics Overview" text
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  summarySection: {
    paddingVertical: 5,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  summaryDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 100,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: "#666",
  },
  nutrientCardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  nutrientCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  nutrientValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#385802",
    marginBottom: 4,
    textAlign: "center",
  },
  nutrientTarget: {
    fontSize: 14,
    fontWeight: "normal",
    color: "#666",
  },
  nutrientLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
    fontWeight: "bold",
  },
  circularProgressContainer: {
    alignItems: "center",
  },
  nutrientIcon: {
    width: 30,
    height: 30,
  },
  summaryContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
});
