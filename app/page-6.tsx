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
import { useNutritionIntakeStore, fetchNutritionAverage } from "@/stores/nutritionIntakeStore";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import BarChart from "@/components/Barchart";
import { format, addDays } from "date-and-time";

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
  const { nutritionDataAve: averageData, fetchNutritionIntakeAve } = fetchNutritionAverage();

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
            user: parseFloat((sod / 1000).toFixed(2)), // Convert mg to g
            avg: parseFloat((intakeData.avg_sodium / 1000).toFixed(2)) // Convert mg to g
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

  // Generate sample weekly data for the bar chart
  const weeklyChartData = [
    // Sunday
    {
      value: nutritionData.values.carbohydrate.user,
      frontColor: "#F4D03F",
      spacing: 2,
      label: "S",
    },
    {
      value: nutritionData.values.sodium.user * 10, // Scale up for visibility
      frontColor: "#8B4513",
    },
    {
      value: nutritionData.values.protein.user / 2, // Scale down for visibility
      frontColor: "#9AB106",
      spacing: 8,
    },
    // Monday
    {
      value: nutritionData.values.carbohydrate.avg,
      frontColor: "#F4D03F",
      spacing: 2,
      label: "M",
    },
    {
      value: nutritionData.values.sodium.avg * 8,
      frontColor: "#8B4513",
    },
    {
      value: nutritionData.values.protein.avg / 2,
      frontColor: "#9AB106",
      spacing: 8,
    },
    // Tuesday
    {
      value: nutritionData.values.carbohydrate.user * 0.8,
      frontColor: "#F4D03F",
      spacing: 2,
      label: "T",
    },
    {
      value: nutritionData.values.sodium.user * 12,
      frontColor: "#8B4513",
    },
    {
      value: nutritionData.values.protein.user / 3,
      frontColor: "#9AB106",
      spacing: 8,
    },
    // Wednesday
    {
      value: nutritionData.values.carbohydrate.avg * 1.2,
      frontColor: "#F4D03F",
      spacing: 2,
      label: "W",
    },
    {
      value: nutritionData.values.sodium.avg * 15,
      frontColor: "#8B4513",
    },
    {
      value: nutritionData.values.protein.avg / 2,
      frontColor: "#9AB106",
      spacing: 8,
    },
    // Thursday
    {
      value: nutritionData.values.carbohydrate.user * 0.9,
      frontColor: "#F4D03F",
      spacing: 2,
      label: "TH",
    },
    {
      value: nutritionData.values.sodium.user * 11,
      frontColor: "#8B4513",
    },
    {
      value: nutritionData.values.protein.user / 2.5,
      frontColor: "#9AB106",
      spacing: 8,
    },
    // Friday
    {
      value: nutritionData.values.carbohydrate.avg * 0.7,
      frontColor: "#F4D03F",
      spacing: 2,
      label: "F",
    },
    {
      value: nutritionData.values.sodium.avg * 14,
      frontColor: "#8B4513",
    },
    {
      value: nutritionData.values.protein.avg / 1.8,
      frontColor: "#9AB106",
      spacing: 8,
    },
    // Saturday
    {
      value: nutritionData.values.carbohydrate.user * 1.1,
      frontColor: "#F4D03F",
      spacing: 2,
      label: "S",
    },
    {
      value: nutritionData.values.sodium.user * 9,
      frontColor: "#8B4513",
    },
    {
      value: nutritionData.values.protein.user / 2.2,
      frontColor: "#9AB106",
    },
  ];

  // Date range for the chart
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = addDays(today, -dayOfWeek);
  const endOfWeek = addDays(startOfWeek, 6);

  let startStr = format(startOfWeek, "MMM D");
  let endStr = format(endOfWeek, "D");

  if (startOfWeek.getMonth() !== endOfWeek.getMonth()) {
    endStr = format(endOfWeek, "MMM D");
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/NutriVision.png")}
            style={styles.logo}
            accessibilityRole="image"
            accessibilityLabel="NutriVision logo"
          />
        </View>

        <ThemedView style={styles.contentContainer}>
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

          {/* Weekly Chart using BarChart component */}
          <BarChart
            data={weeklyChartData}
            title="Weekly Intake Ratio"
            subtitle={`Aug 10-15`}
            maxValue={150}
            stepValue={50}
            height={200}
            barWidth={12}
            spacing={2}
            showLegend={true}
            legendData={[
              { color: "#F4D03F", label: "Carbohydrates" },
              { color: "#8B4513", label: "Sodium" },
              { color: "#9AB106", label: "Protein" },
            ]}
          />
        </ThemedView>
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
    backgroundColor: "#F5F5F5",
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
    paddingBottom: 16,
    backgroundColor: "#F5F5F5",
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