// photo-label-details.tsx - The main page component
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  PanResponder,
  Animated,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "@/types/types";
import ReturnButton from "@/components/ReturnButton";
import AvgIntakeCard from "@/components/avgIntakeCard";
import CalorieCard from "@/components/CalorieCard";

import AmountSelector from "@/components/amount";
import { useDetailedNutrientStore } from "@/stores/useDetailedNutrientStore";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;
const BOTTOM_SHEET_MIN_HEIGHT = 120;

type PhotoLabelDetailsRouteProp = RouteProp<
  RootStackParamList,
  "photo-label-details"
>;
type PhotoLabelDetailsNavigationProp = StackNavigationProp<
  RootStackParamList,
  "photo-label-details"
>;

// Main Page Component
function PhotoLabelDetailsPage() {
  const route = useRoute();
  const navigation = useNavigation<PhotoLabelDetailsNavigationProp>();

  // Get data from Zustand store
  const { intakes, updateIntakeByIndex } = useDetailedNutrientStore();

  // Get the index from route params
  const params = route.params as { imageIndex?: number };
  const imageIndex = params?.imageIndex ?? 0;

  // Get the specific intake data for this image
  const currentIntake = intakes[imageIndex] || {
    carbs: 0,
    sodium: 0,
    protein: 0,
    calories: 0,
    servings: 1,    
    type: "Nutritional Label",
    imageUrl: "placeholder",
  };

  const translateY = useRef(new Animated.Value(0)).current;
  const currentY = useRef(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const [amount, setAmount] = useState(1);
  const confirmedRef = useRef(false);

  // Restore servings from store on mount
  useEffect(() => {
    confirmedRef.current = false; // Reset on mount
    if (currentIntake.servings !== undefined) {
      setAmount(currentIntake.servings);
    }

    // Cleanup: Log if user exits without confirming
    return () => {
      if (!confirmedRef.current) {
        console.log(`⚠️ [Label Details] Exited without confirming - Store NOT updated`);
      }
    };
  }, [imageIndex]);

  const nutrientPerServing = {
    carbs: parseFloat((currentIntake.carbs * amount).toFixed(2)),
    protein: parseFloat((currentIntake.protein * amount).toFixed(2)),
    sodium: parseFloat((currentIntake.sodium * amount).toFixed(2)),
    calories: parseFloat((currentIntake.calories * amount).toFixed(2)),
  };

  const handleIncrease = () => {
    setAmount((prev) => {
      console.log(`📊 [Label Details] Amount increased to ${prev + 1} (LOCAL STATE ONLY - not saved)`);
      return prev + 1;
    });
  };

  const handleDecrease = () => {
    setAmount((prev) => {
      const newVal = Math.max(1, prev - 1);
      console.log(`📊 [Label Details] Amount decreased to ${newVal} (LOCAL STATE ONLY - not saved)`);
      return newVal;
    });
  };

  const handleConfirmIntake = () => {
    // Mark as confirmed to ensure store is updated
    confirmedRef.current = true;

    console.log(`✅ [Label Details] CONFIRM pressed - Saving servings=${amount} to store`);

    // Only save the servings (not the calculated nutrients)
    // Keep the original nutrient values so they can be recalculated
    updateIntakeByIndex(imageIndex, {
      servings: amount,
    });

    // Navigate back
    navigation.goBack();
  };

  useEffect(() => {
    const listener = translateY.addListener(({ value }) => {
      currentY.current = value;
    });
    return () => translateY.removeListener(listener);
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        translateY.setOffset(currentY.current);
        translateY.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        const newY = gestureState.dy;
        const clampedY = Math.max(Math.min(newY, BOTTOM_SHEET_MIN_HEIGHT), 0);
        translateY.setValue(clampedY);
      },
      onPanResponderRelease: (evt, gestureState) => {
        translateY.flattenOffset();

        const shouldExpand =
          gestureState.vy < -0.5 ||
          (gestureState.vy > -0.5 &&
            currentY.current < -BOTTOM_SHEET_MAX_HEIGHT / 2);

        if (shouldExpand) {
          setIsExpanded(true);
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        } else {
          setIsExpanded(false);
          Animated.spring(translateY, {
            toValue: BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const overlayOpacity = translateY.interpolate({
    inputRange: [0, BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT],
    outputRange: [0.4, 0],
    extrapolate: "clamp",
  });

  const carbsIcon = require("@/assets/images/Carbohydrate Icon.png");
  const sodiumIcon = require("@/assets/images/Sodium Icon.png");
  const proteinIcon = require("@/assets/images/Protein Icon.png");

  // Get image URI - handle both string and object formats
  const imageUri =
    typeof currentIntake.imageUrl === "string"
      ? currentIntake.imageUrl
      : (currentIntake.imageUrl as any)?.uri || "placeholder";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Background Image Container */}
      <View style={styles.imageContainer}>
        {imageUri === "placeholder" ? (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              Captured Photo Will Appear Here
            </Text>
            <Text style={styles.placeholderSubtext}>
              Image from camera module
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: imageUri }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        )}
      </View>

      {/* Overlay when sheet is expanded */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents={isExpanded ? "auto" : "none"}
      />

      {/* Bottom Sheet */}
      <Animated.View
        style={[styles.bottomSheet, { transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        {/* Handle Bar */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Content Container */}
        <ScrollView>
          <View style={styles.contentContainer}>
            {/* Title */}
            <View style={styles.amountHeader}>
              <Text style={styles.title}>
                {currentIntake.type || "Nutritional Label"}
              </Text>
              <AmountSelector
                amount={amount}
                label="Servings"
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
              />
            </View>

            <View style={styles.calorieContainer}>
              <CalorieCard
                value={nutrientPerServing.calories}
                tintColor="#9AB206"
              />
            </View>

            {/* Nutritional Cards Row */}
            <View style={styles.cardsRow}>
              <View style={styles.cardContainer}>
                <AvgIntakeCard
                  iconSource={carbsIcon}
                  tintColor="#9AB206"
                  subtitle="Carbs"
                  value={nutrientPerServing.carbs}
                  fill={100}
                />
              </View>

              <View style={styles.cardContainer}>
                <AvgIntakeCard
                  iconSource={sodiumIcon}
                  tintColor="#9AB206"
                  subtitle="Sodium"
                  value={nutrientPerServing.sodium}
                  fill={100}
                />
              </View>

              <View style={styles.cardContainer}>
                <AvgIntakeCard
                  iconSource={proteinIcon}
                  tintColor="#9AB206"
                  subtitle="Protein"
                  value={nutrientPerServing.protein}
                  fill={100}
                />
              </View>
            </View>

            {/* Servings Container */}
            <View style={styles.servingsCard}>
              <Text style={styles.servingsTitle}>
                Number of Servings in Package:{" "}
                {currentIntake.originalServings || currentIntake.servings || 1}
              </Text>
            </View>
            {/* Confirm Button */}
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmIntake}
            >
              <Text style={styles.confirmButtonText}>Confirm Intake</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Return Button - positioned absolutely */}
      <ReturnButton position="top" />
    </View>
  );
}

// Screen Component with Navigation
export default function NutritionalLabelScreen() {
  return <PhotoLabelDetailsPage />;
}

const styles = StyleSheet.create({
  confirmButton: {
    backgroundColor: "#9AB206",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  amountHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 15,
  },
  imageContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  placeholderText: {
    color: "#9AB206",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  placeholderSubtext: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_SHEET_MAX_HEIGHT,
    backgroundColor: "#f8f9fa",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 140,
    height: 5,
    backgroundColor: "#2A302D",
    borderRadius: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 5,
    textAlign: "left",
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  cardContainer: {
    flex: 1,
    minHeight: 150,
  },
  servingsCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginTop: 22,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  servingsTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
  },
  calorieContainer: {
    marginBottom: 20,
  },
});
