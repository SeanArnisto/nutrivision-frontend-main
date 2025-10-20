import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import BMICard from "./BMICard";

interface BMIModalProps {
  visible: boolean;
  onClose: () => void;
  bmiValue: number;
  weight: number;
  height: number;
}

export default function BMIModal({
  visible,
  onClose,
  bmiValue,
  weight,
  height,
}: BMIModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlayTouchable} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
              {/* BMI Title */}
              <Text style={styles.title}>Your BMI:</Text>
              <Text style={styles.bmiValue}>{bmiValue.toFixed(1)}</Text>

              {/* BMI Card */}
              <View style={styles.bmiCardContainer}>
                <BMICard bmiValue={bmiValue} />
              </View>

              {/* Weight and Height Display */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{weight}kg</Text>
                  <Text style={styles.statLabel}>Weight</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{height}cm</Text>
                  <Text style={styles.statLabel}>Height</Text>
                </View>
              </View>

              {/* BMI Calculation Formula */}
              <View style={styles.formulaContainer}>
                <Text style={styles.formulaTitle}>How BMI is Calculated:</Text>
                <View style={styles.formulaBox}>
                  <Text style={styles.formulaText}>
                    BMI = Weight (kg) / Height² (m²)
                  </Text>
                </View>
                <Text style={styles.exampleText}>
                  Your calculation: {weight}kg / ({(height / 100).toFixed(2)}m)²
                  = {bmiValue.toFixed(1)}
                </Text>

                <View style={styles.infoBox}>
                  <Text style={styles.infoTitle}>BMI Categories:</Text>
                  <Text style={styles.infoItem}>
                    • Underweight: BMI &lt; 18.5
                  </Text>
                  <Text style={styles.infoItem}>• Normal: BMI 18.5 - 24.9</Text>
                  <Text style={styles.infoItem}>
                    • Overweight: BMI 25 - 29.9
                  </Text>
                  <Text style={styles.infoItem}>• Obese: BMI ≥ 30</Text>
                </View>
              </View>

              {/* Go Back Button */}
              <TouchableOpacity style={styles.goBackButton} onPress={onClose}>
                <Text style={styles.goBackText}>GO BACK</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  overlayTouchable: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "90%",
    padding: 20,
  },
  scrollContent: {
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  bmiValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#385802",
    marginBottom: 20,
  },
  bmiCardContainer: {
    width: "100%",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 30,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 16,
    color: "#666",
  },
  formulaContainer: {
    width: "100%",
    marginBottom: 20,
  },
  formulaTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  formulaBox: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  formulaText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#385802",
    textAlign: "center",
  },
  exampleText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    fontStyle: "italic",
  },
  infoBox: {
    backgroundColor: "#F9F9F9",
    padding: 16,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  infoItem: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    lineHeight: 20,
  },
  goBackButton: {
    width: "100%",
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#9AB206",
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  goBackText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9AB206",
  },
});
