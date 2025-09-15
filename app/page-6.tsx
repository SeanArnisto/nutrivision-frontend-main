import React, { useState, useEffect } from "react";
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
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "@/types/types";
import { StackNavigationProp } from "@react-navigation/stack";
import { useRoute } from "@react-navigation/native";
import { useNutrientsStore } from "@/hooks/store";
import { useRecommStore } from "@/hooks/store";
import { useNutritionIntakeStore, fetchNutritionAverage, useNutritionAverage } from "@/stores/nutritionIntakeStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import BarChart from "@/components/Barchart";
import { format, addDays } from "date-and-time";
import { getNutritionalHistory } from "@/hooks/store";
import AppLogo from "@/components/appLogo";

const toProgressWidth = (value: number) =>
  `${Math.min(value, 100)}%` as DimensionValue;
const toPercentageText = (value: number) => `${value}%`;
const formatValue = (value: number, unit: string = "g") => `${value} ${unit}`;

type Page6ScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "page-6"
>;

interface NutritionData {
  progress: {
    carbohydrate: { user: number; avg: number };
    sodium: { user: number; avg: number };
    protein: { user: number; avg: number };
  };
  values: {
    carbohydrate: { user: number; avg: number };
    sodium: { user: number; avg: number };
    protein: { user: number; avg: number };
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
  const carbs = useNutrientsStore((state) => state.carbs);
  const prot = useNutrientsStore((state) => state.protein);
  const sod = useNutrientsStore((state) => state.sodium);

  const minCarb = useRecommStore((state) => state.minCarb);
  const maxCarb = useRecommStore((state) => state.maxCarb);
  const minProtein = useRecommStore((state) => state.minProtein);
  const maxProtein = useRecommStore((state) => state.maxProtein);
  const minSodium = useRecommStore((state) => state.minSodium);
  const maxSodium = useRecommStore((state) => state.maxSodium);

  // Get nutrition intake data from stores
  const { nutritionData: intakeData, fetchNutritionIntake } = useNutritionIntakeStore();
  const { nutritionDataAve: averageData, fetchNutritionIntakeAve } = useNutritionAverage();

  // Add nutritional history state for bar chart
  const [nutritionalData, setNutritionalData] = useState<NutritionalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nutritionData, setNutritionData] = useState<NutritionData>({
    progress: {
      carbohydrate: { user: 88, avg: 50 },
      sodium: { user: 33, avg: 50 },
      protein: { user: 45, avg: 50 },
    },
    values: {
      carbohydrate: { user: 53, avg: 49 },
      sodium: { user: 15, avg: 11 },
      protein: { user: 180, avg: 147 },
    },
  });

  // Fetch nutrition data on component mount
  useEffect(() => {
    fetchNutritionIntake();
    fetchNutritionIntakeAve();
  }, []);

  // Fetch nutritional history for bar chart (same as statistics)
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

    fetchNutritionHistory();
  }, []);

  // Update nutritionData when store data changes
  useEffect(() => {
    if (intakeData && averageData) {
      setNutritionData((prev) => ({
        ...prev,
        values: {
          carbohydrate: { 
            user: parseFloat(carbs.toFixed(1)), 
            avg: parseFloat(intakeData.avg_carbs.toFixed(1)) 
          },
          protein: { 
            user: parseFloat(prot.toFixed(1)), 
            avg: parseFloat(intakeData.avg_protein.toFixed(1)) 
          },
          sodium: { 
            user: parseFloat(sod.toFixed(2)), 
            avg: parseFloat((intakeData.avg_sodium / 1000).toFixed(2)) 
          },
        },
      }));
    } else if (intakeData) {
      // Use intakeData if averageData is not available
      setNutritionData((prev) => ({
        ...prev,
        values: {
          carbohydrate: { 
            user: parseFloat(carbs.toFixed(1)), 
            avg: parseFloat(intakeData.avg_carbs.toFixed(1)) 
          },
          protein: { 
            user: parseFloat(prot.toFixed(1)), 
            avg: parseFloat(intakeData.avg_protein.toFixed(1)) 
          },
          sodium: { 
            user: parseFloat((sod / 1000).toFixed(2)), // Convert mg to g
            avg: parseFloat((intakeData.avg_sodium / 1000).toFixed(2)) // Convert mg to g
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
            user: parseFloat(carbs.toFixed(1)), 
            avg: parseFloat(carbAvg.toFixed(1)) 
          },
          protein: { 
            user: parseFloat(prot.toFixed(1)), 
            avg: parseFloat(proteinAvg.toFixed(1)) 
          },
          sodium: { 
            user: parseFloat((sod / 1000).toFixed(2)), // Convert mg to g
            avg: parseFloat((sodiumAvg / 1000).toFixed(2)) // Convert mg to g
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
          user: parseFloat(((prev.values.carbohydrate.user / prev.values.carbohydrate.avg) * 50).toFixed(1)),
          avg: 50, // Always 50 for average bar
        },
        protein: {
          user: parseFloat(((prev.values.protein.user / prev.values.protein.avg) * 50).toFixed(1)),
          avg: 50, // Always 50 for average bar
        },
        sodium: {
          user: parseFloat(((prev.values.sodium.user / prev.values.sodium.avg) * 50).toFixed(1)),
          avg: 50, // Always 50 for average bar
        },
      },
    }));
  }, [nutritionData.values]);

  function handleGoBack() {
    navigation.goBack();
  }

  const navigation = useNavigation<Page6ScreenNavigationProp>();

  const handleCheck = () => {
    navigation.navigate("feedback");
  };

  // Get average values for bar chart calculations
  const carbAvg = intakeData?.avg_carbs ? Math.round(intakeData.avg_carbs) : 0;
  const proteinAvg = intakeData?.avg_protein ? Math.round(intakeData.avg_protein) : 0;
  const sodiumAvg = intakeData?.avg_sodium ? intakeData.avg_sodium / 1000 : 0;

  // Initialize date constants (same as statistics)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  // Format dates for display
  const startStr = format(startOfWeek, "MMM DD");
  const endStr = startOfWeek.getMonth() !== endOfWeek.getMonth()
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
      console.error("Error in getDailyNutritionTotals:", error);
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
            sodium: sod / 1000 // Convert mg to g
          };
        } else {
          // Use historical data for other days
          dailyTotals = getDailyNutritionTotals(currentDate);
          dailyTotals.sodium = dailyTotals.sodium / 1000; // Convert mg to g
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

  // Weekly data for the bar chart using actual values
  const weeklyChartData = generateWeeklyChartData();

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <AppLogo />

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
                        width: toProgressWidth(nutritionData.progress.carbohydrate.user),
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
                        width: toProgressWidth(nutritionData.progress.carbohydrate.avg),
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
                        width: toProgressWidth(nutritionData.progress.sodium.user),
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
                        width: toProgressWidth(nutritionData.progress.sodium.avg),
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
                        width: toProgressWidth(nutritionData.progress.protein.user),
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
                        width: toProgressWidth(nutritionData.progress.protein.avg),
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
          </View>

          {/* Weekly Chart using BarChart component - Same implementation as statistics */}
          <BarChart
            data={weeklyChartData}
            title="Weekly Intake Ratio"
            subtitle={`${startStr} - ${endStr}`}
            maxValue={200} // Increased to show ratios above 1.0 (100%)
            stepValue={50} // Steps of 50% (0.5 ratio)
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
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
  },
  nutrientText: {
    fontSize: 14,
    color: "#333",
    marginRight: 8,
  },
  icon: {
    width: 20,
    height: 20,
  },
  progressBars: {
    flex: 3.5,
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
    flex: 0.8,
    alignItems: "flex-end",
  },
  userValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  avgValue: {
    fontSize: 12,
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
});