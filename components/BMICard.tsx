import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface BMICardProps {
  bmiValue: number;
  onInfoPress?: () => void;
}

export default function BMICard({ bmiValue, onInfoPress }: BMICardProps) {
  // Determine BMI category
  const getBMICategory = (bmi: number): string => {
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  // Get category badge color based on BMI
  const getCategoryColor = (bmi: number): string => {
    if (bmi < 18.5) return "#84CDEE";  // Blue for Underweight
    if (bmi < 25) return "#9AB206";    // Green for Normal
    if (bmi < 30) return "#FFDF32";    // Yellow for Overweight
    return "#F5554A";                  // Red for Obese
  };

  // Calculate position percentage based on actual BMI ranges
  const getIndicatorPosition = (bmi: number): number => {
    // Define the visual range boundaries
    const minBMI = 15;
    const maxBMI = 40;
    
    // Clamp the BMI value
    const clampedBMI = Math.max(minBMI, Math.min(maxBMI, bmi));
    
    // Calculate percentage based on actual BMI thresholds
    // Segment widths: Underweight=14%, Normal=26%, Overweight=20%, Obese=40%
    // Boundaries: 18.5 at 14%, 25 at 40%, 30 at 60%
    let percentage = 0;
    
    if (clampedBMI <= 18.5) {
      // Underweight: 0% to 14% (15 to 18.5)
      percentage = ((clampedBMI - 15) / (18.5 - 15)) * 14;
    } else if (clampedBMI <= 25) {
      // Normal: 14% to 40% (18.5 to 25)
      percentage = 14 + ((clampedBMI - 18.5) / (25 - 18.5)) * 26;
    } else if (clampedBMI <= 30) {
      // Overweight: 40% to 60% (25 to 30)
      percentage = 40 + ((clampedBMI - 25) / (30 - 25)) * 20;
    } else {
      // Obese: 60% to 100% (30 to 40)
      percentage = 60 + ((clampedBMI - 30) / (40 - 30)) * 40;
    }
    
    return Math.min(100, Math.max(0, percentage));
  };

  const category = getBMICategory(bmiValue);
  const categoryColor = getCategoryColor(bmiValue);
  const position = getIndicatorPosition(bmiValue);

  // Color segments based on actual BMI ranges
  // Underweight: 15-18.5, Normal: 18.5-25, Overweight: 25-30, Obese: 30-40
  const segments = [
    { color: "#84CDEE", width: 14 },  // Underweight (15-18.5) = 3.5 units = ~14%
    { color: "#9AB206", width: 26 },  // Normal (18.5-25) = 6.5 units = ~26%
    { color: "#FFDF32", width: 20 },  // Overweight (25-30) = 5 units = ~20%
    { color: "#F5554A", width: 40 },  // Obese (30-40) = 10 units = ~40%
  ];

  // Number of bars per segment (proportional to width)
  const getBarsForSegment = (width: number) => Math.max(3, Math.round(width / 5));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={styles.bmiText}>
            Your BMI: <Text style={styles.bmiValue}>{bmiValue.toFixed(2)}</Text>
          </Text>
          <TouchableOpacity onPress={onInfoPress} style={styles.infoButton}>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="#9AB206"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scale Container with moving category badge */}
      <View style={styles.scaleWrapper}>
        {/* Category Badge positioned above the indicator */}
        <View
          style={[
            styles.categoryBadgeContainer,
            { left: `${position}%` },
          ]}
        >
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Text style={styles.categoryText}>{category}</Text>
          </View>
          {/* Small triangle pointer */}
          <View style={[styles.trianglePointer, { borderTopColor: categoryColor }]} />
        </View>

        {/* BMI Scale Bar with individual segments */}
        <View style={styles.scaleContainer}>
          <View style={styles.scaleBar}>
            {segments.map((segment, segIndex) => (
              <View
                key={segIndex}
                style={[styles.segmentContainer, { flex: segment.width }]}
              >
                {Array.from({ length: getBarsForSegment(segment.width) }).map((_, barIndex) => (
                  <View
                    key={barIndex}
                    style={[
                      styles.individualBar,
                      { backgroundColor: segment.color },
                    ]}
                  />
                ))}
              </View>
            ))}
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
    gap: 12,
  },
  headerRow: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bmiText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#385802",
  },
  bmiValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#385802",
  },
  infoButton: {
    padding: 4,
  },
  scaleWrapper: {
    position: "relative",
    paddingTop: 60,
  },
  categoryBadgeContainer: {
    position: "absolute",
    top: 0,
    alignItems: "center",
    zIndex: 10,
    width: 100,
    marginLeft: -48,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: -12,
    minWidth: 100,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  trianglePointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: 12,
  },
  scaleContainer: {
    position: "relative",
    height: 0,
    justifyContent: "center",
    paddingBottom: 10,
  },
  scaleBar: {
    flexDirection: "row",
    height: 24,
    overflow: "hidden",
  },
  segmentContainer: {
    flexDirection: "row",
    gap: 3,
    paddingHorizontal: 1,
  },
  individualBar: {
    flex: 1,
    height: "100%",
    borderRadius: 2,
  },
});