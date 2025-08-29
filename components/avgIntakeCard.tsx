import React from "react";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import {
  StyleSheet,
  View,
  Image,
  Dimensions,
  SafeAreaView,
  Text,
  TouchableOpacity,
} from "react-native";

interface AvgIntakeCardProps {
  iconSource: any; 
  tintColor: string;
  subtitle: string;
  value: number | string;
  fill?: number;
}

export default function AvgIntakeCard({ 
  iconSource, 
  tintColor, 
  subtitle, 
  value,
  fill = 100 
}: AvgIntakeCardProps) {
  return (
    <>
      <View style={[styles.column]}>
        {
          <View style={styles.textRow}>
            <Text style={styles.titlegrams}>{value} g</Text>
          </View>
        }
        <View style={styles.textRow}>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {/* Circular Progress with Image */}

        <View style={styles.textRow}>
          <View style={styles.progressRow}>
            <View style={{ alignItems: "flex-start", marginTop: 10 }}>
              <AnimatedCircularProgress
                style={{ transform: [{ rotate: "90deg" }, { scaleX: -1 }] }}
                size={95}
                width={10}
                fill={fill} // Percentage fill
                tintColor={tintColor}
                backgroundColor="#dddddd"
              >
                {() => (
                  <Image
                    source={iconSource}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
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
    </>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
    minHeight: 170,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4
  },
  textRow: {
    alignItems: "flex-start",
  },
  progressRow: {},
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#385802",
  },
  titlegrams: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#385802",
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
    paddingHorizontal: 2,
    fontWeight: "bold",
  },
});
