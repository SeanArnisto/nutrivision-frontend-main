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
import PieChart from "react-native-pie-chart";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "@/types/types";
import { StackNavigationProp } from "@react-navigation/stack";
import { useRoute } from "@react-navigation/native";
import { useNutrientsStore } from "@/hooks/store";
import { useRecommStore } from "@/hooks/store";
import { Ionicons } from "@expo/vector-icons";

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
  intake: {
    breakdown: { protein: number; carbohydrate: number; sodium: number };
    total: number;
  };
  avg: {
    breakdown: { protein: number; carbohydrate: number; sodium: number };
    total: number;
  };
}

export default function Page6() {
  const route = useRoute();
  const carbs = useNutrientsStore((state) => state.carbs);
  const prot = useNutrientsStore((state) => state.protein);
  const sod = useNutrientsStore((state) => state.sodium);

  const minCarb = useRecommStore((state) => state.minCarb);
  const maxCarb = useRecommStore((state) => state.maxCarb);
  const minProtein = useRecommStore((state) => state.minProtein);
  const maxProtein = useRecommStore((state) => state.maxProtein);
  const minSodium = useRecommStore((state) => state.minSodium);
  const maxSodium = useRecommStore((state) => state.maxSodium);

  const [nutritionData, setNutritionData] = useState<NutritionData>({
    progress: {
      // these values are what the black and green bars are based on
      carbohydrate: { user: 88, avg: 50 },
      sodium: { user: 33, avg: 50 },
      protein: { user: 45, avg: 50 },
    },
    values: {
      // the values that are displayed on the right side of the bars
      carbohydrate: { user: 53, avg: 49 },
      sodium: { user: 15, avg: 11 },
      protein: { user: 180, avg: 147 },
    },
    intake: {
      // these values are what the pie chart is based on, this is dependent on the images from user
      breakdown: { carbohydrate: 94, sodium: 2, protein: 4 },
      total: 93.33,
    },
    avg: {
      // same as intake but from the average data dependent on the user
      breakdown: { carbohydrate: 77, sodium: 7, protein: 16 },
      total: 402,
    },
  });

  useEffect(() => {
    console.log("✅ Sodium from store:", sod); // Is it 1.9 or 1900?
  }, [sod]);

  useEffect(() => {
    const carbsMin = minCarb; // 346
    const carbsMax = maxCarb;

    const carbAvg = Math.round((carbsMin + carbsMax) / 2);

    const proteinMin = minProtein; // 56
    const proteinMax = maxProtein;

    const proteinAvg = Math.round((proteinMin + proteinMax) / 2);

    const sodiumMin = minSodium; // 1500
    const sodiumMax = maxSodium;

    const sodiumAvg = Math.round((sodiumMin + sodiumMax) / 2);

    setNutritionData((prev) => ({
      ...prev,
      progress: {
        carbohydrate: {
          ...prev.progress.carbohydrate,
          avg: parseFloat(carbAvg.toFixed(1)),
        },
        protein: {
          ...prev.progress.protein,
          avg: parseFloat(proteinAvg.toFixed(1)),
        },
        sodium: {
          ...prev.progress.sodium,
          avg: parseFloat(sodiumAvg.toFixed(1)),
        },
      },
      values: {
        carbohydrate: {
          ...prev.values.carbohydrate,
          avg: parseFloat(carbAvg.toFixed(1)),
        },
        protein: {
          ...prev.values.protein,
          avg: parseFloat(proteinAvg.toFixed(1)),
        },
        sodium: {
          ...prev.values.sodium,
          avg: parseFloat((sodiumAvg/1000).toFixed(1)),
        },
      },
    }));
  }, [minCarb, maxCarb, minProtein, maxProtein, minSodium, maxSodium]);

  function handleGoBack() {
    navigation.goBack();
  }

  useEffect(() => {
    const carbohydrate = carbs; // right side variables are from global state to avoid confusion
    const protein = prot;
    const sodium = sod;

    const total = carbohydrate + protein + sodium;

    // Avoid zero total for the donut chart
    const safeTotal = total > 0 ? total : 1;

    const pieCarb = parseFloat(((carbohydrate / safeTotal) * 100).toFixed(2));
    const pieProtein = parseFloat(((protein / safeTotal) * 100).toFixed(2));
    const pieSodium = parseFloat(((sodium / safeTotal) * 100).toFixed(2));

    setNutritionData((prev) => ({
      ...prev,
      intake: {
        ...prev.intake,
        breakdown: {
          carbohydrate: pieCarb,
          protein: pieProtein,
          sodium: pieSodium,
        },
        total: parseFloat(total.toFixed(2)),
      },
      values: {
        carbohydrate: {
          ...prev.values.carbohydrate,
          user: parseFloat(carbohydrate.toFixed(1)),
        },
        protein: {
          ...prev.values.protein,
          user: parseFloat(protein.toFixed(1)),
        },
        sodium: {
          ...prev.values.sodium,
          user: parseFloat(sodium.toFixed(1)),
        },
      },
      progress: {
        carbohydrate: {
          ...prev.progress.carbohydrate,
          user: parseFloat(((carbohydrate / 100) * 100).toFixed(1)),
        },
        protein: {
          ...prev.progress.protein,
          user: parseFloat(((protein / 200) * 100).toFixed(1)),
        },
        sodium: {
          ...prev.progress.sodium,
          user: parseFloat(((sodium / 2.3) * 100).toFixed(1)),
        },
      },
    }));
  }, [carbs, prot, sod]);

  const navigation = useNavigation<Page6ScreenNavigationProp>();

  const handleCheck = () => {
    navigation.navigate("feedback");
  };

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
                <Text style={styles.legendText}>User input</Text>
              </View>
              <View style={[styles.legendItem, styles.legendItemSpacing]}>
                <View style={[styles.legendSquare, styles.avgLegend]} />
                <Text style={styles.legendText}>Average intake</Text>
              </View>
            </View>

            {/* Carbohydrate Row (was Sugar) */}
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
                          (nutritionData.values.carbohydrate.user /
                            nutritionData.values.carbohydrate.avg) *
                            50
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
                        width: toProgressWidth(50),
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
                          (nutritionData.values.sodium.user /
                            nutritionData.values.sodium.avg) *
                            50
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
                        width: toProgressWidth(50),
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

            {/* Protein Row (was Calories) */}
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
                          (nutritionData.values.protein.user /
                            nutritionData.values.protein.avg) *
                            50
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
                        width: toProgressWidth(50),
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

          {/* Donut Charts Section */}
          <View style={styles.chartsContainer}>
            {/* User Intake Donut Chart */}
            <View style={styles.chartBox}>
              <View style={styles.chartRow}>
                <View style={styles.chartWrapper}>
                  <PieChart
                    widthAndHeight={150}
                    series={[
                      {
                        value: nutritionData.intake.breakdown.protein,
                        color: "#000000",
                      },
                      {
                        value: nutritionData.intake.breakdown.carbohydrate,
                        color: "#7ca844",
                      },
                      {
                        value: nutritionData.intake.breakdown.sodium,
                        color: "#c0b4b4",
                      },
                    ]}
                    cover={0.55}
                  />
                </View>
                <View style={styles.legendWrapper}>
                  <Text style={styles.chartTitle}>User Intake</Text>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.colorCircle,
                        { backgroundColor: "#7ca844" },
                      ]}
                    />
                    <Text style={styles.legendLabel}>
                      Carbs (
                      {toPercentageText(
                        nutritionData.intake.breakdown.carbohydrate
                      )}
                      )
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.colorCircle,
                        { backgroundColor: "#c0b4b4" },
                      ]}
                    />
                    <Text style={styles.legendLabel}>
                      Sodium (
                      {toPercentageText(nutritionData.intake.breakdown.sodium)})
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.colorCircle,
                        { backgroundColor: "#000000" },
                      ]}
                    />
                    <Text style={styles.legendLabel}>
                      Protein (
                      {toPercentageText(nutritionData.intake.breakdown.protein)}
                      )
                    </Text>
                  </View>
                  <View style={styles.totalBox}>
                    <Text style={styles.totalText}>
                      Total Nutrient{"\n"}Amount ={" "}
                      {formatValue(nutritionData.intake.total)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Average Intake Donut Chart */}
            <View style={styles.chartBox}>
              <View style={styles.chartRow}>
                <View style={styles.chartWrapper}>
                  <PieChart
                    widthAndHeight={150}
                    series={[
                      {
                        value: nutritionData.avg.breakdown.protein,
                        color: "#000000",
                      },
                      {
                        value: nutritionData.avg.breakdown.carbohydrate,
                        color: "#7ca844",
                      },
                      {
                        value: nutritionData.avg.breakdown.sodium,
                        color: "#c0b4b4",
                      },
                    ]}
                    cover={0.55}
                  />
                </View>
                <View style={styles.legendWrapper}>
                  <Text style={styles.chartTitle}>Average Intake</Text>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.colorCircle,
                        { backgroundColor: "#7ca844" },
                      ]}
                    />
                    <Text style={styles.legendLabel}>
                      Carbs (
                      {toPercentageText(
                        nutritionData.avg.breakdown.carbohydrate
                      )}
                      )
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.colorCircle,
                        { backgroundColor: "#c0b4b4" },
                      ]}
                    />
                    <Text style={styles.legendLabel}>
                      Sodium (
                      {toPercentageText(nutritionData.avg.breakdown.sodium)})
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.colorCircle,
                        { backgroundColor: "#000000" },
                      ]}
                    />
                    <Text style={styles.legendLabel}>
                      Protein (
                      {toPercentageText(nutritionData.avg.breakdown.protein)})
                    </Text>
                  </View>
                  <View style={styles.totalBox}>
                    <Text style={styles.totalText}>
                      Total Nutrient{"\n"}Amount ={" "}
                      {formatValue(nutritionData.avg.total)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
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
        <ThemedText style={styles.checkMark}>✓</ThemedText>
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
    bottom: 40,
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
  chartsContainer: {
    gap: 16,
  },
  chartBox: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  chartRow: {
    flexDirection: "row",
  },
  chartWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  legendWrapper: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  colorCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 12,
  },
  legendLabel: {
    fontSize: 12,
    color: "#333",
  },
  totalBox: {
    backgroundColor: "#f8e4e4",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  totalText: {
    fontSize: 14,
    color: "#333",
    textAlign: "left",
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
  checkMark: {
    fontSize: 25,
    color: "#9AB106",
    fontWeight: "bold",
  },
});
