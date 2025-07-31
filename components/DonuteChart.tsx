import React from "react";
import { View, Text, ViewStyle, TextStyle } from "react-native";
import { PieChart } from "react-native-svg-charts";

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
  styles: ChartStyles;
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
  styles,
  formatValue,
  toPercentageText,
}) => {
  const data = [
    {
      value: nutritionData.breakdown.protein,
      svg: { fill: colors.protein },
      key: "protein",
    },
    {
      value: nutritionData.breakdown.sodium,
      svg: { fill: colors.sodium },
      key: "sodium",
    },
    {
      value: nutritionData.breakdown.carbohydrate,
      svg: { fill: colors.carbohydrate },
      key: "carbohydrate",
    },
  ];

  return (
    <View style={styles.chartsContainer}>
      <View style={styles.chartBox}>
        <View style={styles.chartRow}>
          <View style={styles.chartWrapper}>
            <PieChart
              style={{ height: chartSize, width: chartSize }}
              data={data}
              innerRadius={chartSize * coverRadius}
              outerRadius={chartSize / 2}
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
                Carbs ({toPercentageText(nutritionData.breakdown.carbohydrate)})
              </Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[styles.colorCircle, { backgroundColor: colors.sodium }]}
              />
              <Text style={styles.legendLabel}>
                Sodium ({toPercentageText(nutritionData.breakdown.sodium)})
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
                Protein ({toPercentageText(nutritionData.breakdown.protein)})
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
