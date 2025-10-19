import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { BarChart as GiftedBarChart } from 'react-native-gifted-charts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CalorieBarData {
  value: number;
  label?: string;
  frontColor?: string;
  spacing?: number;
}

interface CalorieBarChartProps {
  data: CalorieBarData[];
  title: string;
  subtitle: string;
  maxValue?: number;
  stepValue?: number;
  height?: number;
  barWidth?: number;
  spacing?: number;
  dailyGoal?: number; // Daily calorie goal for reference line
  barColor?: string;
}

const CalorieBarChart: React.FC<CalorieBarChartProps> = ({
  data,
  title,
  subtitle,
  maxValue = 3000,
  stepValue = 500,
  height = 160,
  barWidth = 10,
  spacing = 2,
  dailyGoal = 2000,
  barColor = '#3E3E07',
}) => {
  // Calculate spacing to spread bars evenly
  const chartWidth = SCREEN_WIDTH - 110;
  const totalBars = data.length;
  const totalBarWidth = barWidth * totalBars;
  // Calculate spacing between bars to fill the width
  const spacingBetweenBars = (chartWidth - totalBarWidth - 30) / (totalBars - 1);

  // Map data without individual spacing
  const chartData = data.map((item) => ({
    ...item,
    frontColor: item.frontColor || barColor,
    label: item.label || '',
  }));

  const yAxisLabelTexts = Array.from(
    { length: Math.floor(maxValue / stepValue) + 1 },
    (_, i) => (i * stepValue).toString()
  );

  // Optimize animation duration for Android
  const optimizedAnimationDuration = Platform.OS === 'android' ? 600 : 800;

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <Text style={styles.chartSubtitle}>{subtitle}</Text>

      {/* Legend */}
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: barColor }]}
          />
          <Text style={styles.legendText}>Calories</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: '#000000' }]}
          />
          <Text style={styles.legendText}>Target</Text>
        </View>
      </View>

      {/* Bar Chart */}
      <View style={styles.chartContainer}>
        <GiftedBarChart
          data={chartData}
          width={SCREEN_WIDTH - 110}
          height={height}
          barWidth={barWidth}
          spacing={spacingBetweenBars}
          initialSpacing={15}
          yAxisThickness={0}
          xAxisThickness={0}
          yAxisTextStyle={{ color: '#666', fontSize: 12 }}
          xAxisLabelTextStyle={{
            color: '#666',
            fontSize: 10,
            textAlign: 'center',
          }}
          noOfSections={Math.floor(maxValue / stepValue)}
          maxValue={maxValue}
          stepValue={stepValue}
          yAxisLabelTexts={yAxisLabelTexts}
          rulesType={'solid'}
          rulesColor={'#E5E5E5'}
          rulesLength={SCREEN_WIDTH - 110}
          showReferenceLine1={!!dailyGoal}
          referenceLine1Position={dailyGoal}
          referenceLine1Config={{
            color: '#000000',
            dashWidth: 4,
            dashGap: 4,
            thickness: 1.5,
            type: 'dashed',
          }}
          isAnimated
          animationDuration={optimizedAnimationDuration}
          barBorderRadius={4}
          {...(Platform.OS === 'android' && {
            animationEasing: 'ease',
            animateOnDataChange: true,
          })}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    paddingHorizontal: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    overflow: 'hidden',
  },
});

export default CalorieBarChart;