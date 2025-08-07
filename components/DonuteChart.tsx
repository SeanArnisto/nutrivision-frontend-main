import React from "react";
import { View, Text, ViewStyle, TextStyle, StyleSheet } from "react-native";
import PieChart from "react-native-pie-chart";

interface NutritionBreakdown {
  protein: number;
  sodium: number;
  carbohydrate: number;
}

interface NutritionData {
  breakdown: NutritionBreakdown;
  total: number;
}

interface ColorScheme {
  protein: string;
  sodium: string;
  carbohydrate: string;
}

interface ChartStyles {
  chartsContainer: ViewStyle;
  chartBox: ViewStyle;
  chartRow: ViewStyle;
  chartWrapper: ViewStyle;
  legendWrapper: ViewStyle;
  chartTitle: TextStyle;
  legendItem: ViewStyle;
  colorCircle: ViewStyle;
  legendLabel: TextStyle;
  totalBox: ViewStyle;
  totalText: TextStyle;
}

interface NutritionDonutChartProps {
  nutritionData: NutritionData;
  title?: string;
  chartSize?: number;
  coverRadius?: number;
  colors?: ColorScheme;
  formatValue: (value: number) => string;
  toPercentageText: (value: number) => string;
}

const NutritionDonutChart: React.FC<NutritionDonutChartProps> = ({
  nutritionData,
  title = "Your Intake",
  chartSize = 150,
  coverRadius = 0.55,
  colors = {
    protein: "#000000",
    sodium: "#c0b4b4",
    carbohydrate: "#7ca844",
  },
  formatValue,
  toPercentageText,
}) => {
  // Guard to ensure nutritionData and its breakdown are available
  if (!nutritionData || !nutritionData.breakdown) {
    return null;
  }

  // Extract and validate breakdown values, ensuring they are valid numbers
  const protein = Number(nutritionData.breakdown.protein) || 0;
  const sodium = Number(nutritionData.breakdown.sodium) || 0;
  const carbohydrate = Number(nutritionData.breakdown.carbohydrate) || 0;

  // Define the series as Slice objects for the newer react-native-pie-chart API
  const series = [
    { value: protein, color: colors.protein },
    { value: sodium, color: colors.sodium },
    { value: carbohydrate, color: colors.carbohydrate },
  ];

  // Check if all values are zero (would cause chart rendering issues)
  const totalValue = protein + sodium + carbohydrate;
  if (totalValue === 0) {
    return (
      <View style={styles.chartsContainer}>
        <View style={styles.chartBox}>
          <Text style={styles.chartTitle}>No nutrition data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.chartsContainer}>
      <View style={styles.chartBox}>
        <View style={styles.chartRow}>
          <View style={styles.chartWrapper}>
            <PieChart
              widthAndHeight={chartSize}
              series={series}
              cover={{ radius: coverRadius, color: '#FFF' }}
            />
          </View>
          <View style={styles.legendWrapper}>
            <Text style={styles.chartTitle}>{title}</Text>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.colorCircle,
                  { backgroundColor: colors.carbohydrate },
                ]}
              />
              <Text style={styles.legendLabel}>
                Carbs ({toPercentageText(carbohydrate)})
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[styles.colorCircle, { backgroundColor: colors.sodium }]}
              />
              <Text style={styles.legendLabel}>
                Sodium ({toPercentageText(sodium)})
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.colorCircle,
                  { backgroundColor: colors.protein },
                ]}
              />
              <Text style={styles.legendLabel}>
                Protein ({toPercentageText(protein)})
              </Text>
            </View>

            <View style={styles.totalBox}>
              <Text style={styles.totalText}>
                Total Nutrient{"\n"}Amount = {formatValue(nutritionData.total)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default NutritionDonutChart;

const styles = StyleSheet.create({
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
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
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
});