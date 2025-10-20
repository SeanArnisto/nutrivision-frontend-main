// photo-fruit-details.tsx - The main page component
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
import AmountSelector from "@/components/amount";
import DropdownSelector from "@/components/Dropdown";
import CalorieCard from "@/components/CalorieCard";
import { useDetailedNutrientStore } from "@/stores/useDetailedNutrientStore";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;
const BOTTOM_SHEET_MIN_HEIGHT = 120;

type PhotoFruitDetailsRouteProp = RouteProp<
  RootStackParamList,
  "photo-fruit-details"
>;
type PhotoFruitDetailsNavigationProp = StackNavigationProp<
  RootStackParamList,
  "photo-fruit-details"
>;

// Main Page Component
function PhotoFruitDetailsPage() {
  const route = useRoute<PhotoFruitDetailsRouteProp>();
  const navigation = useNavigation<PhotoFruitDetailsNavigationProp>();

  // Get data from Zustand store
  const { intakes } = useDetailedNutrientStore();

  // Get the index from route params
  const { imageIndex } = route.params || { imageIndex: 0 };

  // Get the specific intake data for this image
  const currentIntake = intakes[imageIndex] || {
    carbs: 0,
    sodium: 0,
    protein: 0,
    calories: 0,
    servings: 1,
    type: "Fruit",
    imageUrl: "placeholder",
  };

  const translateY = useRef(new Animated.Value(0)).current;
  const [isExpanded, setIsExpanded] = useState(true);
  const currentY = useRef(0);
  const [amount, setAmount] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isDropdownOpenRef = useRef(false);

  // Update ref when state changes
  useEffect(() => {
    isDropdownOpenRef.current = isDropdownOpen;
  }, [isDropdownOpen]);

  const [disabled] = useState(false);
  const [fruitCut, setFruitCut] = useState(1);
  const [slices, setSlices] = useState(1);

  const fruitCutRange = { minAmount: 1, maxAmount: 15 };
  const slicesRange = { minAmount: 0, maxAmount: 15 };

  // Generate options based on fruitCut value
  const optionsLength = fruitCut === 1 ? 99 : fruitCut;
  const dropdownLabel = fruitCut === 1 ? "Amount" : "Slices to eat";
  const optionUnit = fruitCut === 1 ? "amount" : "slice";

  const options = Array.from({ length: optionsLength }, (_, i) => ({
    label: `${i + 1} ${i + 1 === 1 ? optionUnit : optionUnit + "s"}`,
    value: `${i + 1}`,
  }));

  const [selectedValue, setSelectedValue] = useState(options[0].value);

  // Update selectedValue when fruitCut changes and current value exceeds new limit
  useEffect(() => {
    const currentValue = parseInt(selectedValue);
    if (fruitCut > 1 && currentValue > fruitCut) {
      setSelectedValue("1");
    }
  }, [fruitCut]);

  // Calculate nutrients based on fruitCut and selectedValue
  const selectedAmount = parseInt(selectedValue) || 1;

  // If fruitCut = 1: multiply by selectedAmount (whole fruits)
  // If fruitCut > 1: divide by fruitCut (portion size), then multiply by selectedAmount (slices eaten)
  const multiplier = fruitCut === 1 ? selectedAmount : (selectedAmount / fruitCut);

  const nutrientPerServing = {
    carbs: parseFloat((currentIntake.carbs * multiplier).toFixed(2)),
    protein: parseFloat((currentIntake.protein * multiplier).toFixed(2)),
    sodium: parseFloat((currentIntake.sodium * multiplier).toFixed(4)),
    calories: parseFloat((currentIntake.calories * multiplier).toFixed(2)),
  };

  const handleFruitCutIncrease = () => {
    setFruitCut((prev) => Math.min(prev + 1, fruitCutRange.maxAmount));
  };

  const handleFruitCutDecrease = () => {
    setFruitCut((prev) => Math.max(prev - 1, fruitCutRange.minAmount));
  };

  const handleSlicesIncrease = () => {
    setSlices((prev) => Math.min(prev + 1, slicesRange.maxAmount));
  };

  const handleSlicesDecrease = () => {
    setSlices((prev) => Math.max(prev - 1, slicesRange.minAmount));
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
        // Don't capture gestures when dropdown is open
        if (isDropdownOpenRef.current) return false;
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

  const isFruitCutDecreaseDisabled =
    disabled || fruitCut <= fruitCutRange.minAmount;
  const isFruitCutIncreaseDisabled =
    disabled || fruitCut >= fruitCutRange.maxAmount;

  const isSlicesDecreaseDisabled = disabled || slices <= slicesRange.minAmount;
  const isSlicesIncreaseDisabled = disabled || slices >= slicesRange.maxAmount;

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
      >
        {/* Handle Bar - Keep this outside ScrollView */}
        <View style={styles.handleContainer} {...panResponder.panHandlers}>
          <View style={styles.handle} />
        </View>

        {/* Scrollable Content Container */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          {/* Title */}
          <View style={styles.amountHeader}>
            <Text style={styles.title}>{currentIntake.type || "Fruit"}</Text>
            <DropdownSelector
              value={selectedValue}
              options={options}
              onChange={(value) => setSelectedValue(value as string)}
              label={dropdownLabel}
              placeholder={options[0].label}
              onOpenChange={setIsDropdownOpen}
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

          {/* fruit cut */}
          <View style={styles.servingsCard}>
            <View style={styles.servingsCardContent}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.decreaseButton,
                  isFruitCutDecreaseDisabled && styles.disabledButton,
                ]}
                onPress={handleFruitCutDecrease}
                disabled={isFruitCutDecreaseDisabled}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.buttonText,
                    isFruitCutDecreaseDisabled && styles.disabledButtonText,
                  ]}
                >
                  −
                </Text>
              </TouchableOpacity>

              <Text style={styles.servingsTitle}>
                {fruitCut}{" "}
                {fruitCut === 1
                  ? "whole fruit"
                  : fruitCut === 2
                  ? "halves"
                  : "portions"}
              </Text>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.increaseButton,
                  isFruitCutIncreaseDisabled && styles.disabledButton,
                ]}
                onPress={handleFruitCutIncrease}
                disabled={isFruitCutIncreaseDisabled}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.buttonText,
                    isFruitCutIncreaseDisabled && styles.disabledButtonText,
                  ]}
                >
                  +
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.confirmButtonText}>Confirm Intake</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {/* Return Button - positioned absolutely */}
      <ReturnButton position="top" />
    </View>
  );
}

// Screen Component with Navigation
export default function FruitScreen() {
  return <PhotoFruitDetailsPage />;
}

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  decreaseButton: {
    // No margin needed with space-between
  },
  increaseButton: {
    // No margin needed with space-between
  },
  disabledButton: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    lineHeight: 20,
  },
  disabledButtonText: {
    color: "#ccc",
  },
  amountHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 15,
  },
  servingsCardContent: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
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
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
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
  amountContainer: {
    marginBottom: 20,
    alignItems: "flex-end",
  },
  amountLabel: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  amountSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  amountButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  amountButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#666",
  },
  amountValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: "center",
  },
  servingsCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
  },
  calorieContainer: {
    marginBottom: 20,
  },
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
});