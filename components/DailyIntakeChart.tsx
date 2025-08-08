import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface DayData {
  day: string;
  userInput: number;
  averageIntake: number;
  date: string;
}

interface DailyIntakeChartProps {
  data?: DayData[];
}

// Sample data for the chart
const defaultData: DayData[] = [
  { day: 'Jan 1', userInput: 94, averageIntake: 100, date: 'January 1, 2025' },
  { day: 'Jan 2', userInput: 89, averageIntake: 100, date: 'January 2, 2025' },
  { day: 'Jan 3', userInput: 97, averageIntake: 100, date: 'January 3, 2025' },
  { day: 'Jan 4', userInput: 97, averageIntake: 100, date: 'January 4, 2025' },
  { day: 'Jan 5', userInput: 90, averageIntake: 100, date: 'January 5, 2025' },
  { day: 'Jan 6', userInput: 100, averageIntake: 100, date: 'January 6, 2025' },
  { day: 'Jan 7', userInput: 102, averageIntake: 100, date: 'January 7, 2025' },
];

export default function DailyIntakeChart({ data = defaultData }: DailyIntakeChartProps) {
  const chartData = {
    labels: data.map(item => item.day),
    datasets: [
      {
        data: data.map(item => item.userInput),
        color: (opacity = 1) => `rgba(74, 93, 35, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: data.map(item => item.averageIntake),
        color: (opacity = 1) => `rgba(154, 177, 6, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
    },
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Intake Ratio</Text>
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4a5d23' }]} />
          <Text style={styles.legendText}>User Input</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#9AB106' }]} />
          <Text style={styles.legendText}>Average Intake</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
          withDots={true}
          withShadow={false}
          withInnerLines={false}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          yAxisSuffix="%"
          yAxisInterval={1}
        />
      </View>

      {/* Date Labels */}
      <View style={styles.xAxisLabels}>
        {data.map((item, index) => (
          <Text key={index} style={styles.xAxisLabel}>
            {item.date}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'AlbertSans-Bold',
  },
  legendContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'AlbertSans-Regular',
  },
  chartContainer: {
    alignItems: 'center',
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  xAxisLabel: {
    fontSize: 9,
    color: '#666',
    fontFamily: 'AlbertSans-Regular',
    textAlign: 'center',
    flex: 1,
    transform: [{ rotate: '-45deg' }],
  },
});