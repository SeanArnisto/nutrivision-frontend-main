import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import AppLogo from "@/components/appLogo";
import BottomNavBar from "@/components/BottomNavBar";
import { CircularProgress } from "react-native-circular-progress";
import ProfileBox from "@/components/ProfileBox";
import { format, addDays } from "date-and-time";
import BarChart from "@/components/Barchart";
import { useNutritionIntakeStore } from "@/stores/nutritionIntakeStore";
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
  status: 'low' | 'recommended' | 'high';
}

function NutrientCard({
  value,
  target,
  label,
  unit,
  iconSource,
  status,
}: NutrientCardProps) {
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

  return (
    <View style={styles.nutrientCard}>
      <Text style={styles.nutrientValue}>
        {value}
        {unit}
        <Text style={styles.nutrientTarget}>
          /{target}
          {unit}
        </Text>
      </Text>
      <Text style={styles.nutrientLabel}>{label}</Text>

      <View style={styles.circularProgressContainer}>
        <CircularProgress
          size={80}
          width={6}
          fill={percentage}
          tintColor={getStatusColor()}
          backgroundColor="#DDDDDD"
          lineCap="round"
        >
          {() => <Image source={iconSource} style={styles.nutrientIcon} />}
        </CircularProgress>
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

  const [nutritionalData, setNutritionalData] = useState<NutritionalRecord[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const {
    // nutrition fetching constant
    nutritionData,
    error: intakeError,
    fetchNutritionIntake,
  } = useNutritionIntakeStore();

  // Fetch nutrition intake data on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNutritionIntake();
    }
  }, [isAuthenticated, user, fetchNutritionIntake]);

  const carbAvg = nutritionData?.avg_carbs
    ? Math.round(nutritionData.avg_carbs)
    : 0;
  const proteinAvg = nutritionData?.avg_protein
    ? Math.round(nutritionData.avg_protein)
    : 0;
  const sodiumAvg = nutritionData?.avg_sodium
    ? nutritionData.avg_sodium / 1000
    : 0; // No division by 1000 if already in correct units

  // Fetch user nutrition input (30 days)
  useEffect(() => {
    const fetchNutritionHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getNutritionalHistory(30);

        if (result.success) {
          setNutritionalData(result.data || []);
        } else {
          setError(result.error || "Failed to load nutritional data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    // Actually call the function
    fetchNutritionHistory();
  }, []);

  const getTodaysRecords = () => {
    // filter to only get the data from the date the app is currently used
    const today = new Date().toDateString();

    return nutritionalData.filter(
      (record) => new Date(record.created_at).toDateString() === today
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

  const todaysNutrition = todaysNutritionTotal();

  // Sample data matching the design
  const nutrientData = [
    {
      value: todaysNutrition.carbohydrates,
      target: carbAvg,
      label: "Carbs",
      unit: "g",
      iconSource: require("@/assets/images/Carbohydrate Icon.png"),
      status: "low" as const,
    },
    {
      value: todaysNutrition.sodium,
      target: sodiumAvg,
      label: "Sodium",
      unit: "g",
      iconSource: require("@/assets/images/Sodium Icon.png"),
      status: "recommended" as const,
    },
    {
      value: todaysNutrition.protein,
      target: proteinAvg,
      label: "Protein",
      unit: "g",
      iconSource: require("@/assets/images/Protein Icon.png"),
      status: "high" as const,
    },
  ];

  // Weekly data for the bar chart
  const weeklyChartData = [
    // Sunday
    {
      value: 75,
      frontColor: "#F4D03F", // Carbs - Yellow
      spacing: 2,
      label: "S",
    },
    {
      value: 150,
      frontColor: "#8B4513", // Sodium - Brown
    },
    {
      value: 30,
      frontColor: "#9AB106", // Protein - Green
      spacing: 8,
    },
    // Monday
    {
      value: 75,
      frontColor: "#F4D03F", // Carbs - Yellow
      spacing: 2,
      label: "M",
    },
    {
      value: 30,
      frontColor: "#8B4513", // Sodium - Brown
    },
    {
      value: 75,
      frontColor: "#9AB106", // Protein - Green
      spacing: 8,
    },
    // Tuesday
    {
      value: 30,
      frontColor: "#F4D03F", // Carbs - Yellow
      spacing: 2,
      label: "T",
    },
    {
      value: 120,
      frontColor: "#8B4513", // Sodium - Brown
    },
    {
      value: 30,
      frontColor: "#9AB106", // Protein - Green
      spacing: 8,
    },
    // Wednesday
    {
      value: 75,
      frontColor: "#F4D03F", // Carbs - Yellow
      spacing: 2,
      label: "W",
    },
    {
      value: 150,
      frontColor: "#8B4513", // Sodium - Brown
    },
    {
      value: 30,
      frontColor: "#9AB106", // Protein - Green
      spacing: 8,
    },
    // Thursday
    {
      value: 75,
      frontColor: "#F4D03F", // Carbs - Yellow
      spacing: 2,
      label: "TH",
    },
    {
      value: 150,
      frontColor: "#8B4513", // Sodium - Brown
    },
    {
      value: 30,
      frontColor: "#9AB106", // Protein - Green
      spacing: 8,
    },
    // Friday
    {
      value: 75,
      frontColor: "#F4D03F", // Carbs - Yellow
      spacing: 2,
      label: "F",
    },
    {
      value: 150,
      frontColor: "#8B4513", // Sodium - Brown
    },
    {
      value: 30,
      frontColor: "#9AB106", // Protein - Green
      spacing: 8,
    },
    // Saturday
    {
      value: 120,
      frontColor: "#F4D03F", // Carbs - Yellow
      spacing: 2,
      label: "S",
    },
    {
      value: 75,
      frontColor: "#8B4513", // Sodium - Brown
    },
    {
      value: 30,
      frontColor: "#9AB106", // Protein - Green
    },
  ];

  // date constants
  const today = new Date();
  const dayOfWeek = today.getDay(); // start of the current week
  const startOfWeek = addDays(today, -dayOfWeek);
  const endOfWeek = addDays(startOfWeek, 6);

  // date formatting ng mga start ng linggo tska dulo
  let startStr = format(startOfWeek, "MMM D");
  let endStr = format(endOfWeek, "D");

  // kapag lilipat na ng buwan hahahaha
  if (startOfWeek.getMonth() !== endOfWeek.getMonth()) {
    endStr = format(endOfWeek, "MMM D");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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
    />
  ))}
</View>

          {/* Weekly Chart using the new BarChart component */}
          <BarChart
            data={weeklyChartData}
            title="Weekly Intake Ratio"
            subtitle={`${startStr} - ${endStr}`}
            maxValue={150}
            stepValue={50}
            height={160}
            barWidth={10}
            spacing={2}
            showLegend={true}
            legendData={[
              { color: "#F4D03F", label: "Carbohydrates" },
              { color: "#8B4513", label: "Sodium" },
              { color: "#9AB106", label: "Protein" },
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
    backgroundColor: "#F5F5F5",
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileBoxContainer: {
    marginBottom: 20,
  },
  customProfileBox: {
    width: 200, // Wider than default 150px to accommodate longer text
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 120,
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
