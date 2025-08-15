import React from "react";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import {
  StyleSheet,
  View,
  Image,
  Text,
} from "react-native";

interface ResponsiveNutritionCardProps {
  iconSource: any; 
  tintColor: string;
  subtitle: string;
  value: number | string;
  fill?: number;
  containerWidth: number; // Add this to control responsiveness
}

export default function ResponsiveNutritionCard({ 
  iconSource, 
  tintColor, 
  subtitle, 
  value,
  fill = 100,
  containerWidth
}: ResponsiveNutritionCardProps) {
  
  // Calculate responsive sizes based on container width
  const circleSize = Math.max(Math.min(containerWidth * 0.4, 95), 75); // Min 75px, max 95px
  const iconSize = 32; // Keep icon size fixed at 32px
  const strokeWidth = 8; // Keep stroke width fixed at 8px
  
  return (
    <View style={[styles.column, { maxWidth: containerWidth }]}>
      <View style={styles.textRow}>
        <Text style={styles.title}>{value}g</Text>
      </View>
      <View style={styles.textRow}>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      
      {/* Circular Progress with Image */}
      <View style={styles.circleRow}>
        <View style={styles.progressRow}>
          <View style={{ alignItems: "center", marginTop: 10 }}>
            <AnimatedCircularProgress
              style={{ transform: [{ rotate: "90deg" }, { scaleX: -1 }] }}
              size={circleSize}
              width={strokeWidth}
              fill={fill}
              tintColor={tintColor}
              backgroundColor="#dddddd"
            >
              {() => (
                <Image
                  source={iconSource}
                  style={{
                    width: iconSize,
                    height: iconSize,
                    borderRadius: 16,
                    transform: [{ rotate: "450deg" }, { scaleX: -1 }],
                  }}
                  resizeMode="contain"
                />
              )}
            </AnimatedCircularProgress>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  textRow: {
    alignItems: "flex-start",
  },
  circleRow: {
    alignItems: "center",
  },
  progressRow: {
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#385802",
    textAlign: "left",
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    fontWeight: "bold",
    textAlign: "left",
    marginTop: 2,
  },
});