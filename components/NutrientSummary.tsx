import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { nutrients } from '@/constants/nutrientIcons';

interface NutrientSummaryProps {
  carbs: { current: number; target: number };
  sodium: { current: number; target: number };
  protein: { current: number; target: number };
}

interface NutrientItem {
  label: string;
  current: number;
  target: number;
  icon: any;
  color: string;
}

export default function NutrientSummary({
  carbs,
  sodium,
  protein,
}: NutrientSummaryProps) {
  const getIntakeStatus = (current: number, target: number) => {
    const ratio = current / target;
    if (ratio < 0.8) return 'low';
    if (ratio > 1.2) return 'high';
    return 'recommended';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return '#ccc';
      case 'high': return '#e74c3c';
      case 'recommended': return '#9AB106';
      default: return '#ccc';
    }
  };

  const nutrientData: NutrientItem[] = [
    {
      label: 'Total Carbs',
      current: carbs.current,
      target: carbs.target,
      icon: nutrients.carbohydrate.icon,
      color: nutrients.carbohydrate.tintColor,
    },
    {
      label: 'Total Sodium',
      current: sodium.current,
      target: sodium.target,
      icon: nutrients.sodium.icon,
      color: nutrients.sodium.tintColor,
    },
    {
      label: 'Total Protein',
      current: protein.current,
      target: protein.target,
      icon: nutrients.protein.icon,
      color: nutrients.protein.tintColor,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Summary</Text>
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ccc' }]} />
          <Text style={styles.legendText}>Low Intake</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#9AB106' }]} />
          <Text style={styles.legendText}>Recommended Intake</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#e74c3c' }]} />
          <Text style={styles.legendText}>High Intake</Text>
        </View>
      </View>

      <Text style={styles.nutrientLabel}>Nutrient</Text>
      
      {/* Nutrient Items */}
      <View style={styles.nutrientsContainer}>
        {nutrientData.map((nutrient, index) => {
          const status = getIntakeStatus(nutrient.current, nutrient.target);
          const statusColor = getStatusColor(status);
          
          return (
            <View key={index} style={styles.nutrientItem}>
              <View style={styles.nutrientInfo}>
                <Text style={styles.nutrientValue}>
                  {nutrient.current}g<Text style={styles.targetText}>/{nutrient.target}g</Text>
                </Text>
                <Text style={styles.nutrientName}>{nutrient.label}</Text>
              </View>
              
              <View style={[styles.iconContainer, { backgroundColor: statusColor }]}>
                <Image source={nutrient.icon} style={styles.icon} />
              </View>
            </View>
          );
        })}
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
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'AlbertSans-Regular',
    flex: 1,
  },
  nutrientLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'AlbertSans-Bold',
  },
  nutrientsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutrientItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutrientInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  nutrientValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'AlbertSans-Bold',
  },
  targetText: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#666',
    fontFamily: 'AlbertSans-Regular',
  },
  nutrientName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'AlbertSans-Regular',
    marginTop: 4,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 30,
    height: 30,
    tintColor: '#fff',
  },
});
