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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "@/types/types"; // Import your existing types
import ReturnButton from "@/components/ReturnButton";
import AvgIntakeCard from "@/components/avgIntakeCard";
import CalorieCard from "@/components/CalorieCard";
import AmountSelector from "@/components/amount";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;
const BOTTOM_SHEET_MIN_HEIGHT = 120;

// Use your existing RootStackParamList from types.ts
type PhotoLabelDetailsRouteProp = RouteProp<
  RootStackParamList,
  "photo-label-details"
>;
type PhotoLabelDetailsNavigationProp = StackNavigationProp<
  RootStackParamList,
  "photo-label-details"
>;

interface NutritionalData {
  carbs: number;
  sodium: number;
  protein: number;
  servings: number;
}

const calories = {
  value: 20,
  fill: 20,
  maxCalories: 20,
};

interface PhotoLabelDetailsPageProps {
  imageUri: string;
  nutritionalData?: NutritionalData;
}

// Main Page Component
function PhotoLabelDetailsPage({
  imageUri = "placeholder",
  nutritionalData = {
    carbs: 18,
    sodium: 1.8,
    protein: 2,
    servings: 1,
  },
}: PhotoLabelDetailsPageProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const currentY = useRef(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const [amount, setAmount] = useState(1);

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

  // Placeholder icons - replace these with your actual icon paths
  // For now, comment these out to avoid errors until you add the icon files
  const carbsIcon = require("@/assets/images/Carbohydrate Icon.png");
  const sodiumIcon = require("@/assets/images/Sodium Icon.png");
  const proteinIcon = require("@/assets/images/Protein Icon.png");

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
        <View style={styles.contentContainer}>
          {/* Title */}
          <View style={styles.amountHeader}>
            <Text style={styles.title}>Nutritional Label</Text>
            <AmountSelector
              amount={amount}
              label="Servings"
              onIncrease={() => setAmount((prev) => prev + 1)}
              onDecrease={() => setAmount((prev) => prev - 1)}
            />
          </View>

          <View style={styles.calorieContainer}>
            <CalorieCard value={calories.value} tintColor="#9AB206" />
          </View>

          {/* Nutritional Cards Row */}

          <View style={styles.cardsRow}>
            <View style={styles.cardContainer}>
              <AvgIntakeCard
                iconSource={carbsIcon}
                tintColor="#9AB206"
                subtitle="Carbs"
                value={nutritionalData.carbs}
                fill={100}
              />
            </View>

            <View style={styles.cardContainer}>
              <AvgIntakeCard
                iconSource={sodiumIcon}
                tintColor="#9AB206"
                subtitle="Sodium"
                value={nutritionalData.sodium}
                fill={100}
              />
            </View>

            <View style={styles.cardContainer}>
              <AvgIntakeCard
                iconSource={proteinIcon}
                tintColor="#9AB206"
                subtitle="Protein"
                value={nutritionalData.protein}
                fill={100}
              />
            </View>
          </View>

          {/* Servings Container */}
          <View style={styles.servingsCard}>
            <Text style={styles.servingsTitle}>
              Number of Servings in Package: {nutritionalData.servings}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Return Button - positioned absolutely */}
      <ReturnButton position="top" />
    </View>
  );
}

// Screen Component with Navigation
export default function NutritionalLabelScreen() {
  const route = useRoute<PhotoLabelDetailsRouteProp>();
  const navigation = useNavigation<PhotoLabelDetailsNavigationProp>();

  // Get params from navigation
  const { imageUri, nutritionalData } = route.params || {};

  // Handle case where no params are passed (for testing)
  if (!imageUri && __DEV__) {
    console.warn(
      "NutritionalLabelScreen: No imageUri provided in route params"
    );
  }

  return (
    <PhotoLabelDetailsPage
      imageUri={imageUri || "placeholder"}
      nutritionalData={nutritionalData}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  amountHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
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

/* 
ROUTING SETUP INSTRUCTIONS:

1. Save this file as: /screens/photo-label-details.tsx

2. Add this screen to your navigation stack in App.tsx or your main navigator:

```tsx
import { createStackNavigator } from '@react-navigation/stack';
import PhotoLabelDetailsScreen from './screens/photo-label-details';
import UserNutrientPage from './screens/UserNutrientPage'; // Your existing page

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Camera" 
        component={CameraScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="photo-label-details" 
        component={PhotoLabelDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="nutrient-page" 
        component={UserNutrientPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="page-6" 
        component={Page6Screen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
```

3. Update your PhotoThumbnailGallery usage in UserNutrientPage.tsx:

```tsx
// In UserNutrientPage.tsx:
<PhotoThumbnailGallery 
  photos={capturedPhotos}
  nutritionalData={{
    carbs: carbohydrate,    // Use your existing state values
    sodium: sodium,
    protein: protein,
    servings: 1
  }}
/>
```

4. The PhotoThumbnailGallery component is already updated to navigate to 'photo-label-details'

5. File structure should be:
```
/screens/photo-label-details.tsx (this file)
/screens/UserNutrientPage.tsx (your existing nutrient page)
/components/ReturnButton.tsx (your existing component)
/components/avgIntakeCard.tsx (your existing component)
/components/PhotoThumbnailGallery.tsx (already updated)
```

6. FLOW:
   - User is on nutrient-page.tsx
   - User clicks photo in PhotoThumbnailGallery
   - App navigates to photo-label-details.tsx
   - Photo and nutritional data are displayed with swipe functionality

7. Add icon files to avoid placeholder icons:
```
/assets/images/carbs-icon.png
/assets/images/sodium-icon.png
/assets/images/protein-icon.png
```
*/
