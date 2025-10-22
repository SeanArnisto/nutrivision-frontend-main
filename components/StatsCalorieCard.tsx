import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Image,
  Text,
  Animated,
} from "react-native";

interface StatsCalorieCardProps {
  value?: number;
  target?: number;
  iconSource: any;
}

export default function StatsCalorieCard({ 
  value = 0,
  target = 2000,
  iconSource,
}: StatsCalorieCardProps) {
  const [progressAnim] = useState(new Animated.Value(0));
  
  // Function to determine progress bar color based on value/target ratio
  const getProgressColor = () => {
    if (value === 0) return "#C0C0C0"; // low
    
    const percentage = (value / target) * 100;
    
    if (percentage < 80) {
      return "#C0C0C0"; // low - gray
    } else if (percentage >= 80 && percentage <= 110) {
      return "#9AB106"; // recommended - green
    } else {
      return "#E74C3C"; // high - red
    }
  };
  
  useEffect(() => {
    // Calculate percentage (cap at 100%)
    const percentage = value > 0 ? Math.min((value / target) * 100, 100) : 0;
    
    // Animate the progress bar
    Animated.timing(progressAnim, {
      toValue: percentage,
      duration: 800,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [value, target]);

  // Interpolate the animated value to width percentage
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // Display placeholder or actual value
  const displayValue = value ? value.toString() : "---";
  const displayTarget = target ? target.toString() : "2000";

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        {/* Left side - Circular icon */}
        <View style={styles.iconContainer}>
          <View style={styles.circleBackground}>
            <Image
              source={iconSource}
              style={styles.icon}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Right side - Text and progress bar */}
        <View style={styles.textContainer}>
          <Text style={styles.valueText}>
            {displayValue}
            <Text style={styles.targetText}>/{displayTarget} kcal</Text>
          </Text>
          <Text style={styles.subtitle}>Calories</Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBarFill,
                { 
                  width: progressWidth,
                  backgroundColor: getProgressColor()
                }
              ]} 
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
  },
  contentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  circleBackground: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 8,
    borderColor: "#3E3E07",
  },
  icon: {
    width: 45,
    height: 45,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  valueText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#385802",
    marginBottom: 2,
  },
  targetText: {
    fontSize: 20,
    fontWeight: "normal",
    color: "#666",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 10,
  },
});