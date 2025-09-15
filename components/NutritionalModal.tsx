// NutritionalModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Spoon images mapping
const SPOON_IMAGES = {
  green: require("@/assets/images/spoongreen.png"),
  red: require("@/assets/images/spoonred.png"),
  gray: require("@/assets/images/spoongray.png"),
} as const;

// Helper function to get tablespoon equivalent
const getTablespoonEquivalent = (
  grams: number,
  isNutrient: "carbs" | "protein" | "sodium"
): string => {
  const tablespoons = grams / 15;

  if (isNutrient === "sodium") {
    if (tablespoons < 0.25) {
      return "less than ¼ tbsp";
    } else if (tablespoons < 0.5) {
      return "¼ tbsp";
    } else if (tablespoons < 1) {
      return "½ tbsp";
    } else {
      const rounded = Math.round(tablespoons * 4) / 4;
      return `${rounded} tbsp${rounded > 1 ? "s" : ""}`;
    }
  }

  if (tablespoons < 1) {
    return "less than 1 tbsp";
  } else {
    const rounded = Math.round(tablespoons);
    return `${rounded} tbsp${rounded > 1 ? "s" : ""}`;
  }
};

// Spoon Visualization Component
const SpoonVisualization = React.memo(({
  value,
  minIntake,
  maxIntake,
}: {
  value: number;
  minIntake: number;
  maxIntake: number;
}) => {
  const maxSpoons = 5;
  const gramsPerSpoon = 15;
  const totalTablespoons = value / gramsPerSpoon;
  const filledSpoons = Math.min(Math.ceil(totalTablespoons), maxSpoons);
  const showPlusSign = totalTablespoons > maxSpoons;
  const showLessThanSign = totalTablespoons < 1;
  const isInGoodRange = value >= minIntake && value <= maxIntake;

  const spoonStates = Array.from({ length: maxSpoons }, (_, index) => {
    if (index < filledSpoons) {
      return isInGoodRange ? "green" : "red";
    }
    return "gray";
  });

  const getSpoonImage = (state: string) => {
    return SPOON_IMAGES[state as keyof typeof SPOON_IMAGES] || SPOON_IMAGES.gray;
  };

  return (
    <View style={modalStyles.spoonContainer}>
      {spoonStates.map((state, index) => (
        <Image
          key={index}
          source={getSpoonImage(state)}
          style={modalStyles.individualSpoon}
        />
      ))}
      {showLessThanSign && (
        <Text
          style={[
            modalStyles.lessThanSign,
            { color: isInGoodRange ? "#4CAF50" : "#F44336" },
          ]}
        >
          &lt;
        </Text>
      )}
      {showPlusSign && (
        <Text
          style={[
            modalStyles.plusSign,
            { color: isInGoodRange ? "#4CAF50" : "#F44336" },
          ]}
        >
          +
        </Text>
      )}
    </View>
  );
});

// Nutrient Item Component
const NutrientItem = ({
  label,
  value,
  unit,
  minIntake,
  maxIntake,
  nutrientType,
}: {
  label: string;
  value: number;
  unit: string;
  minIntake: number;
  maxIntake: number;
  nutrientType: "carbs" | "protein" | "sodium";
}) => {
  return (
    <View style={modalStyles.nutrientItem}>
      <View style={modalStyles.nutrientLeft}>
        <Text style={modalStyles.nutrientLabel}>
          {label}: {value}{unit}
        </Text>
        <Text style={modalStyles.nutrientSubtext}>
          {getTablespoonEquivalent(value, nutrientType)}
        </Text>
      </View>
      <View style={modalStyles.nutrientRight}>
        <SpoonVisualization
          value={value}
          minIntake={minIntake}
          maxIntake={maxIntake}
        />
      </View>
    </View>
  );
};

// Main Modal Component
interface NutritionalModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  nutritionData: {
    carbs: number;
    sodium: number;
    protein: number;
  };
  recommendations: {
    carbsMin: number;
    carbsMax: number;
    sodiumMin: number;
    sodiumMax: number;
    proteinMin: number;
    proteinMax: number;
  };
  loading?: boolean;
}

const NutritionalModal: React.FC<NutritionalModalProps> = ({
  visible,
  onClose,
  onSave,
  nutritionData,
  recommendations,
  loading = false,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
    >
      <View style={modalStyles.overlay}>
        <SafeAreaView style={modalStyles.safeArea}>
          <View style={modalStyles.modalContainer}>
            {/* Header */}
            <View style={modalStyles.header}>
              <View style={modalStyles.logoContainer}>
                <Text style={modalStyles.logoText}>NutriXtract</Text>
                <Ionicons name="leaf" size={20} color="#9AB206" />
              </View>
              <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView 
              style={modalStyles.content}
              showsVerticalScrollIndicator={false}
            >
              {/* Legend */}
              <View style={modalStyles.legendContainer}>
                <Image
                  source={require("@/assets/images/spoon.png")}
                  style={modalStyles.legendSpoon}
                  resizeMode="contain"
                />
                <Text style={modalStyles.legendText}>= 15 grams</Text>
              </View>

              {/* Nutrition Items */}
              <View style={modalStyles.nutritionSection}>
                <NutrientItem
                  label="Carbs"
                  value={nutritionData.carbs}
                  unit="g"
                  minIntake={recommendations.carbsMin}
                  maxIntake={recommendations.carbsMax}
                  nutrientType="carbs"
                />

                <NutrientItem
                  label="Sodium"
                  value={nutritionData.sodium}
                  unit="g"
                  minIntake={recommendations.sodiumMin}
                  maxIntake={recommendations.sodiumMax}
                  nutrientType="sodium"
                />

                <NutrientItem
                  label="Protein"
                  value={nutritionData.protein}
                  unit="g"
                  minIntake={recommendations.proteinMin}
                  maxIntake={recommendations.proteinMax}
                  nutrientType="protein"
                />
              </View>

              {/* Health Information */}
              <View style={modalStyles.healthInfo}>
                <Text style={modalStyles.healthInfoText}>
                  Proper intake of sodium, salt, and carbs is essential for heart health, blood pressure regulation, and overall well-being. For most adults, daily sodium intake should ideally not exceed 2.3g. with a lower limit of 1.5g being beneficial for those with high blood pressure or specific health concerns. Cholesterol intake should also be monitored closely, especially for those at risk of cardiovascular disease.
                </Text>
              </View>
            </ScrollView>

            {/* Footer Button */}
            <View style={modalStyles.footer}>
              <TouchableOpacity
                style={[modalStyles.saveButton, loading && modalStyles.saveButtonDisabled]}
                onPress={onSave}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="home" size={20} color="#fff" />
                    <Text style={modalStyles.saveButtonText}>Save & Go Home</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

// Styles
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.85,
    backgroundColor: '#F5F7FA',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F5F7FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9AB206',
    marginRight: 5,
  },
  closeButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  legendSpoon: {
    width: 25,
    height: 25,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4D4444',
  },
  nutritionSection: {
    marginBottom: 20,
  },
  nutrientItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
  },
  nutrientLeft: {
    flex: 1,
  },
  nutrientLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4D4444',
    marginBottom: 4,
  },
  nutrientSubtext: {
    fontSize: 12,
    color: '#9D9696',
  },
  nutrientRight: {
    marginLeft: 15,
  },
  spoonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  individualSpoon: {
    width: 32,
    height: 24,
    marginLeft: -14,
  },
  plusSign: {
    fontSize: 20,
    marginTop: 15,
    textAlign: 'center',
    marginLeft: -8,
    fontWeight: 'bold',
  },
  lessThanSign: {
    fontSize: 20,
    marginTop: 15,
    marginLeft: -8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  healthInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  healthInfoText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#4D4444',
    textAlign: 'justify',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F5F7FA',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#7ca844',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#c0b4b4',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default NutritionalModal;