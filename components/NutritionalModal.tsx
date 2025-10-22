// NutritionalModal.tsx
import React, { useState, useCallback } from 'react';
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
    calories: number;
  };
  recommendations: {
    carbsMin: number;
    carbsMax: number;
    sodiumMin: number;
    sodiumMax: number;
    proteinMin: number;
    proteinMax: number;
    caloriesMin: number;
    caloriesMax: number;
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
  const [hasClickedYes, setHasClickedYes] = useState(false);

  const handleYesClick = useCallback(() => {
    if (hasClickedYes || loading) {
      return; // Prevent multiple clicks
    }
    
    setHasClickedYes(true);
    onSave();
  }, [hasClickedYes, loading, onSave]);

  // Reset the clicked state when modal becomes visible again
  React.useEffect(() => {
    if (visible) {
      setHasClickedYes(false);
    }
  }, [visible]);

  const isYesButtonDisabled = hasClickedYes || loading;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent={true}
    >
      <View style={modalStyles.overlay}>
        <SafeAreaView style={modalStyles.safeArea}>
          <View style={modalStyles.modalContainer}>
            {/* Header with close button */}
            <View style={modalStyles.header}>
              <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={modalStyles.content}>
              <Text style={modalStyles.title}>Save Session?</Text>
              
              <Text style={modalStyles.message}>
                Data from this session will be saved on your account. Would you like to proceed to the home screen?
              </Text>

              {/* Action Buttons */}
              <View style={modalStyles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    modalStyles.yesButton, 
                    isYesButtonDisabled && modalStyles.buttonDisabled
                  ]}
                  onPress={handleYesClick}
                  disabled={isYesButtonDisabled}
                  activeOpacity={isYesButtonDisabled ? 1 : 0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={modalStyles.yesButtonText}>Yes</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={modalStyles.noButton}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={modalStyles.noButtonText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default NutritionalModal;

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
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  yesButton: {
    backgroundColor: '#9AB206',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  noButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  yesButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  // Legacy styles kept for backward compatibility but not used in new design
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
});