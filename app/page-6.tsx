import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  Image,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  DimensionValue,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "@/types/types";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNutrientsStore } from "@/hooks/store";
import { useRecommStore } from "@/hooks/store";
import ProfileBox from "@/components/ProfileBox";
import {
  useNutritionIntakeStore,
  useNutritionAverage,
} from "@/stores/nutritionIntakeStore";
import { Ionicons } from "@expo/vector-icons";
import BarChart from "@/components/Barchart";
import CalorieBarChart from "@/components/CalorieBarchart";
import { format, addDays } from "date-and-time";
import { getNutritionalHistory } from "@/hooks/store";
import AppLogo from "@/components/appLogo";
import type { NutritionRequest } from "@/stores/useFeedbackStore";
import { useDetailedNutrientStore } from "@/stores/useDetailedNutrientStore";
import useFeedbackStore, {
  useFeedbackError,
  useFeedbackLoading,
} from "@/stores/useFeedbackStore";
import Loading from "./loading";
import CustomModal from "@/components/customModal";
const toProgressWidth = (value: number) =>
  `${Math.min(value, 100)}%` as DimensionValue;
const formatValue = (value: number, unit: string = "g") => {
  // Handle values with up to 5 decimal places, removing trailing zeros
  const formatted = value.toFixed(5).replace(/\.?0+$/, "");
  return `${formatted} ${unit}`;
};

type Page6ScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "page-6"
>;

interface NutritionData {
  progress: {
    carbohydrate: { user: number; avg: number };
    sodium: { user: number; avg: number };
    protein: { user: number; avg: number };
    calories: { user: number; avg: number };
  };
  values: {
    carbohydrate: { user: number; avg: number };
    sodium: { user: number; avg: number };
    protein: { user: number; avg: number };
    calories: { user: number; avg: number };
  };
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

export default function Page6() {
  const { intakes, loading: detailedLoading, error: detailedError, saveToDatabase } = useDetailedNutrientStore();
  const detailedCarbs = intakes.reduce((sum, intake) => sum + (intake.carbs * (intake.servings || 1)), 0);
  const detailedProtein = intakes.reduce((sum, intake) => sum + (intake.protein * (intake.servings || 1)), 0);
  const detailedSodium = intakes.reduce((sum, intake) => sum + (intake.sodium * (intake.servings || 1)), 0);
  const detailedCalories = intakes.reduce((sum, intake) => sum + (intake.calories * (intake.servings || 1)), 0);

  // Move all hooks to the top before any conditional retu
  // rns
  const isLoading = useFeedbackLoading();
  const carbs = detailedCarbs;
  const prot = detailedProtein;
  const sod = detailedSodium;
  const minCarb = useRecommStore((state) => state.minCarb);
  const maxCarb = useRecommStore((state) => state.maxCarb);
  const minProtein = useRecommStore((state) => state.minProtein);
  const maxProtein = useRecommStore((state) => state.maxProtein);
  const minSodium = useRecommStore((state) => state.minSodium);
  const maxSodium = useRecommStore((state) => state.maxSodium);
  const { nutritionData: intakeData, fetchNutritionIntake } =
    useNutritionIntakeStore();
  const {
    nutritionDataAve: averageData,
    fetchNutritionIntakeAve,
    nutritionDataAve,
  } = useNutritionAverage();

  const fetchFeedback = useFeedbackStore((state) => state.fetchFeedback);

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    fetchNutritionIntake();
    fetchNutritionIntakeAve();
  }, []);

  const recommendationValues = useMemo(
    () => ({
      carbsMin:
        nutritionDataAve && minCarb === 0 ? nutritionDataAve.minCarbs : minCarb,
      carbsMax:
        nutritionDataAve && maxCarb === 0 ? nutritionDataAve.maxCarbs : maxCarb,
      sodiumMin:
        nutritionDataAve && minSodium === 0
          ? nutritionDataAve.minSodium
          : minSodium,
      sodiumMax:
        nutritionDataAve && maxSodium === 0
          ? nutritionDataAve.maxSodium
          : maxSodium,
      proteinMin:
        nutritionDataAve && minProtein === 0
          ? nutritionDataAve.minProtein
          : minProtein,
      proteinMax:
        nutritionDataAve && maxProtein === 0
          ? nutritionDataAve.maxProtein
          : maxProtein,
    }),
    [
      nutritionDataAve,
      minCarb,
      maxCarb,
      minSodium,
      maxSodium,
      minProtein,
      maxProtein,
    ]
  );

  // Get nutrition intake data from stores

  // Add nutritional history state for bar chart
  const [nutritionalData, setNutritionalData] = useState<NutritionalRecord[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nutritionData, setNutritionData] = useState<NutritionData>({
    progress: {
      carbohydrate: { user: 88, avg: 50 },
      sodium: { user: 33, avg: 50 },
      protein: { user: 45, avg: 50 },
      calories: { user: 60, avg: 50 },
    },
    values: {
      carbohydrate: { user: 53, avg: 49 },
      sodium: { user: 15, avg: 11 },
      protein: { user: 180, avg: 147 },
      calories: { user: 1800, avg: 2000 },
    },
  });

  // Fetch nutrition data on component mount

  // Fetch nutritional history for bar chart (same as statistics)
  useEffect(() => {
    const fetchNutritionHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getNutritionalHistory(30);

        if (result.success) {
          setNutritionalData(result.data || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchNutritionHistory();
  }, []);

  // Update nutritionData when store data changes
  useEffect(() => {
    if (intakeData && averageData) {
      setNutritionData((prev) => ({
        ...prev,
        values: {
          carbohydrate: {
            user: parseFloat(carbs.toFixed(5)),
            avg: parseFloat(intakeData.avg_carbs.toFixed(5)),
          },
          protein: {
            user: parseFloat(prot.toFixed(5)),
            avg: parseFloat(intakeData.avg_protein.toFixed(5)),
          },
          sodium: {
            user: parseFloat(sod.toFixed(5)),
            avg: parseFloat((intakeData.avg_sodium / 1000).toFixed(5)),
          },
          calories: {
            // Add this
            user: 1800, // Placeholder - replace with actual value when available
            avg: parseFloat(intakeData.avg_calories?.toFixed(5) || "2000"),
          },
        },
      }));
    } else if (intakeData) {
      // Use intakeData if averageData is not available
      setNutritionData((prev) => ({
        ...prev,
        values: {
          carbohydrate: {
            user: parseFloat(carbs.toFixed(5)),
            avg: parseFloat(intakeData.avg_carbs.toFixed(5)),
          },
          protein: {
            user: parseFloat(prot.toFixed(5)),
            avg: parseFloat(intakeData.avg_protein.toFixed(5)),
          },
          sodium: {
            user: parseFloat((sod / 1000).toFixed(5)), // Convert mg to g
            avg: parseFloat((intakeData.avg_sodium / 1000).toFixed(5)), // Convert mg to g
          },
          calories: {
            // Add this
            user: 1800, // Placeholder
            avg: parseFloat(intakeData.avg_calories?.toFixed(5) || "2000"),
          },
        },
      }));
    } else if (averageData) {
      // Use averageData as fallback
      const carbAvg = (averageData.minCarbs + averageData.maxCarbs) / 2;
      const proteinAvg = (averageData.minProtein + averageData.maxProtein) / 2;
      const sodiumAvg = (averageData.minSodium + averageData.maxSodium) / 2;

      setNutritionData((prev) => ({
        ...prev,
        values: {
          carbohydrate: {
            user: parseFloat(carbs.toFixed(5)),
            avg: parseFloat(carbAvg.toFixed(5)),
          },
          protein: {
            user: parseFloat(prot.toFixed(5)),
            avg: parseFloat(proteinAvg.toFixed(5)),
          },
          sodium: {
            user: parseFloat((sod / 1000).toFixed(5)), // Convert mg to g
            avg: parseFloat((sodiumAvg / 1000).toFixed(5)), // Convert mg to g
          },
          calories: {
            // Add this
            user: 1800, // Placeholder
            avg: 2000, // Placeholder
          },
        },
      }));
    }
  }, [carbs, prot, sod, intakeData, averageData]);

  // Update progress bars - Using the same pattern as reference code
  useEffect(() => {
    setNutritionData((prev) => ({
      ...prev,
      progress: {
        carbohydrate: {
          user: parseFloat(
            (
              (prev.values.carbohydrate.user / prev.values.carbohydrate.avg) *
              50
            ).toFixed(1)
          ),
          avg: 50, // Always 50 for average bar
        },
        protein: {
          user: parseFloat(
            ((prev.values.protein.user / prev.values.protein.avg) * 50).toFixed(
              1
            )
          ),
          avg: 50, // Always 50 for average bar
        },
        sodium: {
          user: parseFloat(
            ((prev.values.sodium.user / prev.values.sodium.avg) * 50).toFixed(1)
          ),
          avg: 50, // Always 50 for average bar
        },
        calories: {
          // Add this
          user: parseFloat(
            (
              (prev.values.calories.user / prev.values.calories.avg) *
              50
            ).toFixed(1)
          ),
          avg: 50,
        },
      },
    }));
  }, [nutritionData.values]);

  function handleGoBack() {
    navigation.goBack();
  }

  const navigation = useNavigation<Page6ScreenNavigationProp>();

  const handleCheck = async () => {
    try {
      // Use the same fallback logic as recommendationValues
      const requestData: NutritionRequest = {
        carbs_total: carbs,
        protein_total: prot,
        sodium_total: sod * 1000, // Convert g to mg like in original code
        recommended_carbs: [
          recommendationValues.carbsMin,
          recommendationValues.carbsMax,
        ] as [number, number],
        recommended_sodium: [
          recommendationValues.sodiumMin,
          recommendationValues.sodiumMax,
        ] as [number, number],
        recommended_protein: [
          recommendationValues.proteinMin,
          recommendationValues.proteinMax,
        ] as [number, number],
      };

      console.log("Fetching feedback with data:", requestData);

      // Wait for the fetch to complete
      await fetchFeedback(requestData);

      // Navigate to feedback page (the store will handle success/error states)
      navigation.navigate("feedback");
    } catch (error) {
      console.error("Error fetching feedback:", error);
      // Still navigate to feedback page - the error will be shown there
      navigation.navigate("feedback");
    }
  };

  // Get average values for bar chart calculations
  const carbAvg = intakeData?.avg_carbs ? Math.round(intakeData.avg_carbs) : 0;
  const proteinAvg = intakeData?.avg_protein
    ? Math.round(intakeData.avg_protein)
    : 0;
  const sodiumAvg = intakeData?.avg_sodium ? intakeData.avg_sodium / 1000 : 0;
  const calorieAvg = intakeData?.avg_calories
    ? Math.round(intakeData.avg_calories)
    : 2000;

  // Initialize date constants (same as statistics)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  // Format dates for display
  const startStr = format(startOfWeek, "MMM DD");
  const endStr =
    startOfWeek.getMonth() !== endOfWeek.getMonth()
      ? format(endOfWeek, "MMM DD")
      : format(endOfWeek, "DD");

  // Function to get nutrition totals for a specific date (same as statistics)
  const getDailyNutritionTotals = (date: Date | null) => {
    try {
      if (!date) {
        console.warn("Invalid date provided to getDailyNutritionTotals");
        return { carbohydrates: 0, protein: 0, sodium: 0 };
      }

      const targetDate = new Date(date).toDateString();

      if (!nutritionalData || !Array.isArray(nutritionalData)) {
        console.warn("No nutritional data available");
        return { carbohydrates: 0, protein: 0, sodium: 0 };
      }

      const dayRecords = nutritionalData.filter((record) => {
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
      console.error("Check Internet Connection", "Failed loading data.");
      return { carbohydrates: 0, protein: 0, sodium: 0 };
    }
  };

  // Generate weekly chart data (same logic as statistics but with current values for today)
  const generateWeeklyChartData = () => {
    try {
      const days = ["S", "M", "T", "W", "Th", "F", "S"];
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

        let dailyTotals;

        // Check if current date is today, use current store values
        if (currentDate.toDateString() === today.toDateString()) {
          dailyTotals = {
            carbohydrates: carbs,
            protein: prot,
            sodium: sod, // Convert mg to g
          };
        } else {
          // Use historical data for other days
          dailyTotals = getDailyNutritionTotals(currentDate);
          dailyTotals.sodium = dailyTotals.sodium; // Convert mg to g
        }

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
          spacing: i < 6 ? 8 : 0, // No spacing after the last day
        });
      }

      return chartData;
    } catch (error) {
      console.error("Error in generateWeeklyChartData:", error);
      return [];
    }
  };

  // Generate calorie data for each day of the week
  const generateWeeklyCalorieData = () => {
    try {
      const days = ["S", "M", "T", "W", "TH", "F", "S"];
      const chartData = [];

      if (!startOfWeek) {
        console.warn("startOfWeek is not defined");
        return [];
      }

      for (let i = 0; i < 7; i++) {
        let currentDate;
        try {
          currentDate = addDays(startOfWeek, i);
        } catch (e) {
          console.warn(`Error adding days to startOfWeek: ${e}`);
          currentDate = new Date();
        }

        let dailyCalories;

        // Check if current date is today, use current nutrition values
        if (currentDate.toDateString() === today.toDateString()) {
          // Use the current calorie value from nutritionData state
          dailyCalories = nutritionData.values.calories.user;
        } else {
          // Use historical data for other days
          const targetDate = currentDate.toDateString();
          const dayRecords =
            nutritionalData?.filter((record) => {
              try {
                return (
                  record &&
                  record.created_at &&
                  new Date(record.created_at).toDateString() === targetDate
                );
              } catch (e) {
                return false;
              }
            }) || [];

          // Sum up calories for the day
          dailyCalories = dayRecords.reduce(
            (total, record) => total + (Number(record?.calories) || 0),
            0
          );
        }

        chartData.push({
          value: dailyCalories,
          label: days[i],
        });
      }

      return chartData;
    } catch (error) {
      console.error("Error in generateWeeklyCalorieData:", error);
      return [];
    }
  };

  // Weekly data for the bar chart using actual values
  const weeklyChartData = generateWeeklyChartData();
  const weeklyCalorieData = generateWeeklyCalorieData();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <AppLogo />

        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <ProfileBox
              primaryText="Intake"
              highlightedText="Comparison"
              secondaryText=""
            />
            <TouchableOpacity onPress={() => setIsVisible(true)}>
              <Ionicons
                name="information-circle-outline"
                size={28}
                color="#9AB206"
              />
            </TouchableOpacity>
          </View>
        </View>

        <CustomModal
          visible={isVisible}
          onClose={() => setIsVisible(false)}
          title="Visual Data for Intake "
        >
          <View>
            <Text>
              This screen displays the label or fruit{" "}
              <Text style={{ fontWeight: "bold" }}>intake provided</Text> versus
              your{" "}
              <Text style={{ fontWeight: "bold" }}>average daily intake</Text>
            </Text>
            <Text style={{ marginTop: 16 }}>
              The bar graph shows how much your intake is compared to the
              average in terms of a horizontal line, in the right most the user
              can also see the comparison in terms of numerical data.
            </Text>

            <Text style={{ marginTop: 16 }}>
              The weekly intake chart compares your current input intake to the
              existing intakes saved for the current week.
            </Text>
          </View>
        </CustomModal>

        <View style={styles.contentContainer}>
          {/* Progress Bars Section */}
          <View style={styles.progressContainer}>
            {/* Legends - Now properly spaced */}
            <View style={styles.legendsContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendSquare, styles.userLegend]} />
                <Text style={styles.legendText}>Your intake</Text>
              </View>
              <View style={[styles.legendItem, styles.legendItemSpacing]}>
                <View style={[styles.legendSquare, styles.avgLegend]} />
                <Text style={styles.legendText}>Average intake</Text>
              </View>
            </View>

            {/* Carbohydrate Row */}
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabel}>
                <Text style={styles.nutrientText}>Carbs</Text>
                <Image
                  source={require("@/assets/images/Carbohydrate Icon.png")}
                  style={styles.icon}
                />
              </View>
              <View style={styles.progressBars}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      styles.userProgress,
                      {
                        width: toProgressWidth(
                          nutritionData.progress.carbohydrate.user
                        ),
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      styles.avgProgress,
                      {
                        width: toProgressWidth(
                          nutritionData.progress.carbohydrate.avg
                        ),
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.valueContainer}>
                <Text style={styles.userValue}>
                  {formatValue(nutritionData.values.carbohydrate.user)}
                </Text>
                <Text style={styles.avgValue}>
                  {formatValue(nutritionData.values.carbohydrate.avg)}
                </Text>
              </View>
            </View>

            {/* Sodium Row */}
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabel}>
                <Text style={styles.nutrientText}>Sodium</Text>
                <Image
                  source={require("@/assets/images/Sodium Icon.png")}
                  style={styles.icon}
                />
              </View>
              <View style={styles.progressBars}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      styles.userProgress,
                      {
                        width: toProgressWidth(
                          nutritionData.progress.sodium.user
                        ),
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      styles.avgProgress,
                      {
                        width: toProgressWidth(
                          nutritionData.progress.sodium.avg
                        ),
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.valueContainer}>
                <Text style={styles.userValue}>
                  {formatValue(nutritionData.values.sodium.user)}
                </Text>
                <Text style={styles.avgValue}>
                  {formatValue(nutritionData.values.sodium.avg)}
                </Text>
              </View>
            </View>

            {/* Protein Row */}
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabel}>
                <Text style={styles.nutrientText}>Protein</Text>
                <Image
                  source={require("@/assets/images/Protein Icon.png")}
                  style={styles.icon}
                />
              </View>
              <View style={styles.progressBars}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      styles.userProgress,
                      {
                        width: toProgressWidth(
                          nutritionData.progress.protein.user
                        ),
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      styles.avgProgress,
                      {
                        width: toProgressWidth(
                          nutritionData.progress.protein.avg
                        ),
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.valueContainer}>
                <Text style={styles.userValue}>
                  {formatValue(nutritionData.values.protein.user)}
                </Text>
                <Text style={styles.avgValue}>
                  {formatValue(nutritionData.values.protein.avg)}
                </Text>
              </View>
            </View>
            {/* Calories Row - ADD THIS */}
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientLabel}>
                <Text style={styles.nutrientText}>Calories</Text>
                <Image
                  source={require("@/assets/images/calorie.png")} // You'll need to add this icon
                  style={styles.icon}
                />
              </View>
              <View style={styles.progressBars}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      styles.userProgress,
                      {
                        width: toProgressWidth(
                          nutritionData.progress.calories.user
                        ),
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      styles.avgProgress,
                      {
                        width: toProgressWidth(
                          nutritionData.progress.calories.avg
                        ),
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.valueContainer}>
                <Text style={styles.userValue}>
                  {formatValue(nutritionData.values.calories.user)}
                </Text>
                <Text style={styles.avgValue}>
                  {formatValue(nutritionData.values.calories.avg)}
                </Text>
              </View>
            </View>
          </View>

          {/* Weekly Chart using BarChart component - Same implementation as statistics */}
          <BarChart
            data={weeklyChartData}
            title="Weekly Intake Ratio"
            subtitle={`${startStr} - ${endStr}`}
            maxValue={150} // Maximum value on Y-axis
            stepValue={25} // Steps of 25 (0.25 ratio increments)
            height={160}
            barWidth={10}
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

          {/* Calorie Chart - ADD THIS */}
          <View style={{ marginTop: 16 }}>
            <CalorieBarChart
              data={weeklyCalorieData}
              title="Weekly Calorie Intake"
              subtitle={`${startStr} - ${endStr}`}
              dailyGoal={calorieAvg}
              maxValue={3000}
              stepValue={500}
              height={160}
              barWidth={10}
              spacing={15}
            />
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.roundButton}
        onPress={handleGoBack}
        disabled={false}
      >
        <Ionicons name="arrow-undo-outline" size={28} color="#9AB206" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.checkButton} onPress={handleCheck}>
        <Ionicons name="arrow-redo-outline" size={28} color="#9AB206" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#eff1f6",
  },
  roundButton: {
    width: 60,
    height: 60,
    bottom: 20,
    left: 20,
    borderRadius: 30,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  header: {
    width: "100%",
    height: 100,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 16,
  },
  logo: {
    width: 200,
    height: 60,
    resizeMode: "contain",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#eff1f6",
  },
  progressContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  legendsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  legendItemSpacing: {
    marginLeft: 24,
  },
  legendSquare: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  userLegend: {
    backgroundColor: "black",
  },
  avgLegend: {
    backgroundColor: "#9AB106",
  },
  legendText: {
    fontSize: 18,
    color: "#333",
    fontWeight: "bold",
  },
  nutrientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  nutrientLabel: {
    flex: 1.1,
    flexDirection: "row",
    alignItems: "center",
  },
  nutrientText: {
    fontSize: 14,
    color: "#333",
    marginRight: 2,
    marginLeft: -8,
  },
  icon: {
    width: 20,
    height: 20,
  },
  progressBars: {
    flex: 1.6,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: "#EEEEEE",
    borderRadius: 3,
    marginVertical: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  userProgress: {
    backgroundColor: "black",
  },
  avgProgress: {
    backgroundColor: "#9AB106",
  },
  valueContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  userValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#333",
    
  },
  avgValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#9AB106",
  },
  checkButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  container: {
    flex: 1,
    backgroundColor: "#eff1f6",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
});
