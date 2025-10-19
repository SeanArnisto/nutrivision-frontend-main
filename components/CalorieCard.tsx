import React, { useState, useEffect } from "react";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import {
  StyleSheet,
  View,
  Image,
  Text,
  Platform,
} from "react-native";

interface CalorieCardProps {
  value: number | string;
  fill?: number;
  maxCalories?: number;
}

export default function CalorieCard({ 
  value,
  fill = 100,
  maxCalories = 2000
}: CalorieCardProps) {
  const [animatedFill, setAnimatedFill] = useState(0);
  
  const animationDuration = Platform.OS === 'android' ? 500 : 600;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedFill(fill);
    }, 100);

    return () => clearTimeout(timer);
  }, [fill]);

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        {/* Left side - Text content */}
        <View style={styles.textContainer}>
          <Text style={styles.valueText}>{value} kcal</Text>
          <Text style={styles.subtitle}>Calories</Text>
        </View>

        {/* Right side - Circular progress */}
        <View style={styles.progressContainer}>
          <AnimatedCircularProgress
            style={{ transform: [{ rotate: "90deg" }, { scaleX: -1 }] }}
            size={100}
            width={10}
            fill={animatedFill}
            tintColor="#000000"
            backgroundColor="#dddddd"
            duration={animationDuration}
            prefill={0}
          >
            {() => (
              <Image
                source={require("@/assets/images/calorie.png")}
                style={styles.icon}
                resizeMode="contain"
              />
            )}
          </AnimatedCircularProgress>
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
    minHeight: 130,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  contentWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  valueText: {
    fontSize: 29,
    fontWeight: "bold",
    color: "#385802",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  progressContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 48,
    height: 48,
    transform: [{ rotate: "450deg" }, { scaleX: -1 }],
  },
});