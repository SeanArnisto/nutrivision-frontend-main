// BatteryIndicator.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface BatteryIndicatorProps {
  calories: number;
  averageCalories: number;
  minCalories?: number;
  maxCalories?: number;
}

// Define battery images with correct file names
const BATTERY_IMAGES = {
  low: require("@/assets/images/battery-low.png"),           // RED - very low
  medium: require("@/assets/images/battery-yellow.png"),     // YELLOW - medium
  almostFull: require("@/assets/images/battery-light-green.png"), // LIGHT GREEN - almost full
  full: require("@/assets/images/battery-green.png"),         // GREEN - full/perfect
  over: require("@/assets/images/battery-over.png"),         // RED - too much
} as const;

const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({
  calories,
  averageCalories,
  minCalories = 1700,
  maxCalories = 2300,
}) => {
  const batteryImage = useMemo(() => {
    if (calories < minCalories * 0.7) {
      return BATTERY_IMAGES.low;
    } else if (calories < minCalories) {
      return BATTERY_IMAGES.medium;
    } else if (calories >= minCalories && calories < averageCalories) {
      return BATTERY_IMAGES.almostFull;
    } else if (calories >= averageCalories && calories <= maxCalories) {
      return BATTERY_IMAGES.full;
    } else {
      return BATTERY_IMAGES.over;
    }
  }, [calories, minCalories, maxCalories, averageCalories]);

  return (
    <View style={styles.container}>
      {/* Left side - Icon and text stacked vertically */}
      <View style={styles.leftContent}>
        <View style={styles.iconAndLabel}>
          <Image 
            source={require("@/assets/images/calorie.png")}
            style={styles.calorieIcon}
            resizeMode="contain"
          />
          <Text style={styles.caloriesLabel}>Calories</Text>
        </View>
        <Text style={styles.caloriesValue}>{calories} kcal</Text>
      </View>

      {/* Right side - Battery indicator */}
      <Image 
        source={batteryImage}
        style={styles.batteryIcon}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH * 0.9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 15,
  },
  leftContent: {
    flexDirection: 'column',
    flex: 1,
  },
  
  
  iconAndLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  calorieIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  caloriesLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4D4444',
  },
  caloriesValue: {
    fontSize: 14,
    color: '#9D9696',
    marginLeft: 0, // Changed from 32 to 0 - aligns with icon's left edge
  },
  batteryIcon: {
    width: 75,
    height: 40,
    marginRight: 10,
    marginHorizontal: 5
  },
});

export default React.memo(BatteryIndicator);
