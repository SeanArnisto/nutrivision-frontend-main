import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart as GiftedBarChart } from 'react-native-gifted-charts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BarChartData {
  value: number;
  frontColor: string;
  spacing?: number;
  label?: string;
}

interface BarChartProps {
  data: BarChartData[];
  title: string;
  subtitle: string;
  maxValue?: number;
  stepValue?: number;
  height?: number;
  barWidth?: number;
  spacing?: number;
  showLegend?: boolean;
  referenceLine?: number; // Custom reference line position
  referenceLineColor?: string; // Custom reference line color
  legendData?: Array<{
    color: string;
    label: string;
  }>;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  subtitle,
  maxValue = 150,
  stepValue = 50,
  height = 160,
  barWidth = 10,
  spacing = 2,
  showLegend = true,
  referenceLine,
  referenceLineColor = '#000000',
  legendData = [
    { color: '#F4D03F', label: 'Carbohydrates' },
    { color: '#8B4513', label: 'Sodium' },
    { color: '#9AB106', label: 'Protein' }
  ]
}) => {
  const yAxisLabelTexts = Array.from(
    { length: Math.floor(maxValue / stepValue) + 1 },
    (_, i) => (i * stepValue).toString()
  );

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <Text style={styles.chartSubtitle}>{subtitle}</Text>

      {/* Legend */}
      {showLegend && legendData && (
        <View style={styles.chartLegend}>
          {legendData.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: item.color }]}
              />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Bar Chart */}
      <View style={styles.chartContainer}>
        <GiftedBarChart
          data={data}
          width={SCREEN_WIDTH - 110}
          height={height}
          barWidth={barWidth}
          spacing={spacing}
          initialSpacing={5}
          yAxisThickness={0}
          xAxisThickness={0}
          yAxisTextStyle={{ color: '#666', fontSize: 12 }}
          xAxisLabelTextStyle={{
            color: '#666',
            fontSize: 12,
            textAlign: 'center',
          }}
          noOfSections={Math.floor(maxValue / stepValue)}
          maxValue={maxValue}
          stepValue={stepValue}
          yAxisLabelTexts={yAxisLabelTexts}
          rulesType={'solid'}
          rulesColor={'#E5E5E5'}
          rulesLength={SCREEN_WIDTH - 150}
          showReferenceLine1={!!referenceLine}
          referenceLine1Position={referenceLine || maxValue * 0.67} // Use custom reference line or default to 2/3
          referenceLine1Config={{
            color: referenceLineColor,
            dashWidth: 4,
            dashGap: 4,
            thickness: 1.5,
            type: 'dashed',
          }}
          isAnimated
          animationDuration={1000}
          barBorderRadius={4}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 20,
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
    justifyContent: 'flex-start',
    marginBottom: 20,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#666',
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    overflow: 'hidden',
  },
});

export default BarChart;