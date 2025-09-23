// Feedback.tsx - UPDATED VERSION WITH MODAL
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "expo-router";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import * as MediaLibrary from "expo-media-library";
import { useRecommStore, useNutrientsStore } from "@/hooks/store";
import {
  useNutritionAverage
} from "@/stores/nutritionIntakeStore";
import { Ionicons } from "@expo/vector-icons";
import AppLogo from "@/components/appLogo";
import NutritionalModal from "@/components/NutritionalModal"; // ADD THIS IMPORT
import { useNutritionIntakeStore } from "@/stores/nutritionIntakeStore";
import { usePhotosStore, Photo } from "@/stores/usePhotoStore";
import {useComparisonAnalysis, useHealthImplication, useFeedbackLoading} from "@/stores/useFeedbackStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "index"
>;

// Memoized spoon images to prevent re-creation
const SPOON_IMAGES = {
  green: require("@/assets/images/spoongreen.png"),
  red: require("@/assets/images/spoonred.png"),
  gray: require("@/assets/images/spoongray.png"),
} as const;

// Helper function moved outside component to prevent re-creation
const getTablespoonEquivalent = (
  grams: number,
  isNutrient: "carbs" | "protein" | "sodium"
): string => {
  const tablespoons = grams / 15;

  if (isNutrient === "sodium") {
    // Sodium is usually much smaller amounts
    if (tablespoons < 0.25) {
      return "less than ¼ tbsp";
    } else if (tablespoons < 0.5) {
      return "¼ tbsp";
    } else if (tablespoons < 1) {
      return "½ tbsp";
    } else {
      const rounded = Math.round(tablespoons * 4) / 4; // Round to nearest quarter
      return `${rounded} tbsp${rounded > 1 ? "s" : ""}`;
    }
  }

  // For carbs and protein
  if (tablespoons < 1) {
    return "less than 1 tbsp";
  } else {
    const rounded = Math.round(tablespoons);
    return `${rounded} tbsp${rounded > 1 ? "s" : ""}`;
  }
};

// Memoized SpoonVisualization component
const SpoonVisualization = React.memo(
  ({
    value,
    minIntake,
    maxIntake,
  }: {
    value: number;
    minIntake: number;
    maxIntake: number;
  }) => {
    const spoonData = useMemo(() => {
      const maxSpoons = 5;
      const gramsPerSpoon = 15;
      const totalTablespoons = value / gramsPerSpoon;

      // Calculate how many spoons should be filled based on the value
      const filledSpoons = Math.min(Math.ceil(totalTablespoons), maxSpoons);

      // Check if we need to show a plus sign (more than 5 tablespoons)
      const showPlusSign = totalTablespoons > maxSpoons;

      // Check if we need to show a less than sign (very small amounts)
      const showLessThanSign = totalTablespoons < 1;

      // Spoons turn GREEN when value is within recommended range
      const isInGoodRange = value >= minIntake && value <= maxIntake;

      // Create array of spoon states
      const spoonStates = Array.from({ length: maxSpoons }, (_, index) => {
        if (index < filledSpoons) {
          return isInGoodRange ? "green" : "red";
        }
        return "gray";
      });

      return {
        spoonStates,
        showPlusSign,
        showLessThanSign,
        isInGoodRange,
      };
    }, [value, minIntake, maxIntake]);

    const getSpoonImage = useCallback((state: string) => {
      return (
        SPOON_IMAGES[state as keyof typeof SPOON_IMAGES] || SPOON_IMAGES.gray
      );
    }, []);

    return (
      <View style={styles.rightContainer}>
        <View style={styles.spoonContainer}>
          {spoonData.spoonStates.map((state, index) => (
            <Image
              key={index}
              source={getSpoonImage(state)}
              style={styles.individualSpoon}
            />
          ))}
          {spoonData.showLessThanSign && (
            <Text
              style={[
                styles.lessThanSign,
                { color: spoonData.isInGoodRange ? "#4CAF50" : "#F44336" },
              ]}
            >
              &lt;
            </Text>
          )}
          {spoonData.showPlusSign && (
            <Text
              style={[
                styles.plusSign,
                { color: spoonData.isInGoodRange ? "#4CAF50" : "#F44336" },
              ]}
            >
              +
            </Text>
          )}
        </View>
      </View>
    );
  }
);

function Feedback() {
  const carbs = useNutrientsStore((state) => state.carbs);
  const prot = useNutrientsStore((state) => state.protein);
  const sod = useNutrientsStore((state) => state.sodium);

  const minCarb = useRecommStore((state) => state.minCarb);
  const maxCarb = useRecommStore((state) => state.maxCarb);
  const minProtein = useRecommStore((state) => state.minProtein);
  const maxProtein = useRecommStore((state) => state.maxProtein);
  const minSodium = useRecommStore((state) => state.minSodium);
  const maxSodium = useRecommStore((state) => state.maxSodium);

  const loadUserRecommendations = useRecommStore(
    (state) => state.loadUserRecommendations
  );

  const { fetchNutritionalHistory } = useNutritionIntakeStore();

  // Nutrition average store for better recommendation ranges
  const {
    nutritionDataAve,
    isLoading: nutritionAveLoading,
    error: nutritionAveError,
    fetchNutritionIntakeAve,
  } = useNutritionAverage();

  const { capturedPhotos, clearAllPhotos } = usePhotosStore();

  const comparisonAnalysis = useComparisonAnalysis();
  const healthImplication = useHealthImplication();
  const isLoading = useFeedbackLoading();
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState<
    boolean | null
  >(null);
  const [photosLoading, setPhotosLoading] = useState<boolean>(true);
  // const [capturedPhotos, setCapturedPhotos] = useState<
  //   { uri: string; type: string; orientation: string; id: string }[]
  // >([]);

  // ADD THIS STATE FOR THE MODAL
  const [modalVisible, setModalVisible] = useState(false);

  const navigation = useNavigation() as HomeScreenNavigationProp;

  // Memoize recommendation values to prevent unnecessary re-renders
  const recommendationValues = useMemo(
    () => ({
      carbsMin:
        nutritionDataAve && minCarb === 0 ? nutritionDataAve.minCarbs : minCarb,
      carbsMax:
        nutritionDataAve && maxCarb === 0 ? nutritionDataAve.maxCarbs : maxCarb,
      sodiumMin:
        nutritionDataAve && minSodium === 0
          ? nutritionDataAve.minSodium
          : minSodium,
      sodiumMax:
        nutritionDataAve && maxSodium === 0
          ? nutritionDataAve.maxSodium
          : maxSodium,
      proteinMin:
        nutritionDataAve && minProtein === 0
          ? nutritionDataAve.minProtein
          : minProtein,
      proteinMax:
        nutritionDataAve && maxProtein === 0
          ? nutritionDataAve.maxProtein
          : maxProtein,
    }),
    [
      nutritionDataAve,
      minCarb,
      maxCarb,
      minSodium,
      maxSodium,
      minProtein,
      maxProtein,
    ]
  );

  // Request media library permissions
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setMediaLibraryPermission(status === "granted");
    })();
  }, []);

  // Fetch nutrition average data for better recommendations
  useEffect(() => {
    fetchNutritionIntakeAve();
  }, [fetchNutritionIntakeAve]);

  // Load photos when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (mediaLibraryPermission) {
        loadRecentPhotos();
      } else {
        setPhotosLoading(false);
      }
    }, [mediaLibraryPermission])
  );

  const loadRecentPhotos = async () => {
    // Only load from MediaLibrary on iOS - Android photos are already in store
    if (Platform.OS !== "ios") {
      console.log("Android: Photos already available in store");
      setPhotosLoading(false);
      return;
    }

    try {
      const album = await MediaLibrary.getAlbumAsync("NutriVision");
      if (!album) {
        console.log("NutriVision album not found");
        setPhotosLoading(false);
        return;
      }

      // Rest of your iOS loading logic...
      // But don't call setCapturedPhotos - photos should already be in store from Camera component
      setPhotosLoading(false);
    } catch (error) {
      console.error("Error loading photos from NutriVision album:", error);
      setPhotosLoading(false);
    }
  };

  const carbohydrate = useNutrientsStore((state) => state.carbs);
  const protein = useNutrientsStore((state) => state.protein);
  const sodium = useNutrientsStore((state) => state.sodium);
  const saveWithPhotos = useNutrientsStore((state) => state.saveWithPhotos);
  const reset = useNutrientsStore((state) => state.reset);

  const deleteAllCapturedPhotos = useCallback(
    async (photos: Photo[]) => {
      console.log("🗑️ Starting cleanup of captured photos...");

      if (!photos || photos.length === 0) {
        console.log("No photos to delete");
        return;
      }

      try {
        if (Platform.OS === "ios") {
          // iOS: Delete from MediaLibrary AND clear store
          const { status } = await MediaLibrary.requestPermissionsAsync(false);
          if (status !== "granted") {
            console.warn(
              "Media library permission not granted, clearing store only"
            );
            clearAllPhotos();
            return;
          }

          // Your existing iOS deletion logic...
          // Then clear the store:
          clearAllPhotos();
        } else {
          // Android: Only clear from store
          clearAllPhotos();
          console.log("✅ Cleared captured photos from Android store");
        }
      } catch (error) {
        console.error("❌ Error during photo cleanup:", error);
        clearAllPhotos();
      }
    },
    [clearAllPhotos]
  );

  // UPDATED: Show modal instead of directly saving
  const handleSaveToDatabase = () => {
    // Validate that we have nutrition data
    if (carbohydrate === 0 && protein === 0 && sodium === 0) {
      Alert.alert("No Data", "Please enter nutritional values before saving.", [
        { text: "OK" },
      ]);
      return;
    }

    // Show the modal instead of directly saving
    setModalVisible(true);
  };

  // NEW: Handle the actual save from modal
  const handleModalSave = async () => {
    try {
      const result = await saveWithPhotos(capturedPhotos);

      if (result.success) {
        // IMPORTANT: Refresh the nutritional history in the store after saving
        console.log("📊 Refreshing nutritional history after save...");
        await fetchNutritionalHistory(30);
        console.log("✅ Nutritional history refreshed");

        setModalVisible(false);
        Alert.alert(
          "Success",
          "Nutritional data and photos saved successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                reset();
                clearAllPhotos();
                navigation.reset({
                  index: 0,
                  routes: [{name: 'page-2'}]
                });
              },
            },
          ]
        );
        await deleteAllCapturedPhotos(capturedPhotos);
      } else {
        Alert.alert("Error", result.error || "Failed to save data");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
      console.error("Save error:", error);
    }
  };

  // NEW: Handle modal close
  const handleModalClose = () => {
    setModalVisible(false);
  };

  // Memoized carousel scroll handler to prevent unnecessary re-renders
  const handleCarouselScroll = useCallback((event: any) => {
    const slideIndex = Math.round(
      (event.nativeEvent.contentOffset.x / SCREEN_WIDTH) * 1.11
    );
    setCurrentSlide(slideIndex);
  }, []);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <AppLogo />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            {/* Header with App Logo */}

            {/* Photo Thumbnail Section */}
            <View style={styles.thumbnailSection}>
              <View style={styles.thumbnailWrapper}>
                {photosLoading ? (
                  <Text style={styles.loadingText}>Loading photos...</Text>
                ) : capturedPhotos.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.thumbnailsRow}
                  >
                    {capturedPhotos.map((item, index) => (
                      <View key={index} style={styles.thumbnailContainer}>
                        <Image
                          source={{ uri: item.uri }}
                          style={styles.thumbnail}
                          onError={() => console.log("Image failed to load")}
                        />
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Text style={styles.placeholderText}>
                      No photos available
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Legend */}
            <View style={styles.legendContainer}>
              <View style={styles.textLegendContainer}>
                <Image
                  source={require("@/assets/images/spoon.png")}
                  style={styles.legendSpoon}
                  resizeMode="contain"
                />
                <Text style={styles.textLegend}>= 15 grams</Text>
              </View>
            </View>

            {/* Carbs Display */}
            <View style={styles.nutrientContainer}>
              <View style={styles.textContainer}>
                <Text style={styles.textHeader}>Carbs: {carbs}g</Text>
                <Text style={styles.textSubHeader}>
                  {getTablespoonEquivalent(carbs, "carbs")}
                </Text>
              </View>
              <SpoonVisualization
                value={carbs}
                minIntake={recommendationValues.carbsMin}
                maxIntake={recommendationValues.carbsMax}
              />
            </View>

            {/* Sodium Display */}
            <View style={styles.nutrientContainer}>
              <View style={styles.textContainer}>
                <Text style={styles.textHeader}>Sodium: {sod}g</Text>
                <Text style={styles.textSubHeader}>
                  {getTablespoonEquivalent(sod, "sodium")}
                </Text>
              </View>
              <SpoonVisualization
                value={sod}
                minIntake={recommendationValues.sodiumMin}
                maxIntake={recommendationValues.sodiumMax}
              />
            </View>

            {/* Protein Display */}
            <View style={styles.nutrientContainer}>
              <View style={styles.textContainer}>
                <Text style={styles.textHeader}>Protein: {prot}g</Text>
                <Text style={styles.textSubHeader}>
                  {getTablespoonEquivalent(prot, "protein")}
                </Text>
              </View>
              <SpoonVisualization
                value={prot}
                minIntake={recommendationValues.proteinMin}
                maxIntake={recommendationValues.proteinMax}
              />
            </View>

            {/* Feedback Carousel Section */}
            <View style={styles.feedbackContainer}>
              {isLoading ? (
                <Text style={styles.loadingText}>Generating feedback...</Text>
              ) : (
                <>
                  <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleCarouselScroll}
                    style={styles.carouselScroll}
                  >
                    {/* Slide 1: Comparison Analysis */}
                    <View style={styles.slideContainer}>
                      <Text style={styles.slideTitle}>
                        Nutritional Analysis
                      </Text>
                      <ScrollView
                        style={styles.slideContentScroll}
                        contentContainerStyle={styles.slideContent}
                      >
                        <Text style={styles.feedbackText}>
                          {comparisonAnalysis}
                        </Text>
                      </ScrollView>
                    </View>

                    {/* Slide 2: Health Implications */}
                    <View style={styles.slideContainer}>
                      <Text style={styles.slideTitle}>Health Implications</Text>
                      <ScrollView
                        style={styles.slideContentScroll}
                        contentContainerStyle={styles.slideContent}
                      >
                        <Text style={styles.feedbackText}>
                          {healthImplication}
                        </Text>
                      </ScrollView>
                    </View>
                  </ScrollView>

                  {/* Carousel Indicators */}
                  <View style={styles.indicatorContainer}>
                    <View
                      style={[
                        styles.indicator,
                        currentSlide === 0
                          ? styles.activeIndicator
                          : styles.inactiveIndicator,
                      ]}
                    />
                    <View
                      style={[
                        styles.indicator,
                        currentSlide === 1
                          ? styles.activeIndicator
                          : styles.inactiveIndicator,
                      ]}
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Navigation Buttons */}
      <TouchableOpacity
        style={styles.roundButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-undo-outline" size={28} color="#9AB206" />
      </TouchableOpacity>

      {/* Save Button - Opens Modal */}
      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        onPress={handleSaveToDatabase}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.saveButtonText}>Save to Database</Text>
        )}
      </TouchableOpacity>

      {/* NUTRITIONAL MODAL */}
      <NutritionalModal
        visible={modalVisible}
        onClose={handleModalClose}
        onSave={handleModalSave}
        nutritionData={{
          carbs: carbohydrate,
          sodium: sodium,
          protein: protein,
        }}
        recommendations={{
          carbsMin: recommendationValues.carbsMin,
          carbsMax: recommendationValues.carbsMax,
          sodiumMin: recommendationValues.sodiumMin,
          sodiumMax: recommendationValues.sodiumMax,
          proteinMin: recommendationValues.proteinMin,
          proteinMax: recommendationValues.proteinMax,
        }}
        loading={isLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#eff1f6",
  },
  saveButton: {
    position: "absolute",
    bottom: 40,
    right: 20,
    backgroundColor: "#7ca844",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    minWidth: 150,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  container: {
    flex: 1,
    backgroundColor: "#eff1f6",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    width: "100%",
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  thumbnailSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
  },
  thumbnailWrapper: {
    width: "100%",
    minHeight: 60,
  },
  thumbnailsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    marginHorizontal: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    overflow: "hidden",
  },
  saveButtonDisabled: {
    backgroundColor: "#c0b4b4",
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "SpaceMono-Regular",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "gray",
    fontSize: 12,
    textAlign: "center",
  },
  legendContainer: {
    flexDirection: "row",
    width: SCREEN_WIDTH * 0.9,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  textLegendContainer: {
    flexDirection: "row",
    paddingHorizontal: 5,
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  legendSpoon: {
    width: 30,
    height: 30,
  },
  textLegend: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4D4444",
    marginLeft: 5,
  },
  nutrientContainer: {
    flexDirection: "row",
    width: SCREEN_WIDTH * 0.9,
    height: 70,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  textContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  textHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4D4444",
    paddingBottom: 5,
  },
  textSubHeader: {
    fontSize: 12,
    color: "#9D9696",
  },
  rightContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 5,
    backgroundColor: "white",
    width: SCREEN_WIDTH * 0.35,
  },
  spoonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  individualSpoon: {
    width: 40,
    height: 30,
    marginLeft: -18,
  },
  plusSign: {
    fontSize: 24,
    marginTop: 20,
    textAlign: "center",
    marginLeft: -10,
  },
  lessThanSign: {
    fontSize: 24,
    marginTop: 20,
    marginLeft: -10,
    textAlign: "center",
  },
  feedbackContainer: {
    width: SCREEN_WIDTH * 0.9,
    height: 320,
    borderRadius: 10,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 15,
    overflow: "hidden",
  },
  carouselScroll: {
    flex: 1,
  },
  slideContainer: {
    width: SCREEN_WIDTH * 0.9,
    height: 300,
    paddingHorizontal: 15,
    paddingVertical: 10,
    justifyContent: "flex-start",
  },
  slideTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4D4444",
    marginBottom: 10,
    textAlign: "center",
  },
  slideContentScroll: {
    flex: 1,
  },
  slideContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "white",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: "#9AB206",
  },
  inactiveIndicator: {
    backgroundColor: "#CCCCCC",
  },
  feedbackScroll: {
    flex: 1,
    width: "100%",
  },
  feedbackContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  feedbackText: {
    fontSize: 14,
    color: "#333",
    textAlign: "left",
  },
  loadingText: {
    fontSize: 14,
    color: "gray",
    textAlign: "center",
    marginTop: 20,
  },
  roundButton: {
    width: 60,
    height: 60,
    bottom: 40,
    left: 20,
    borderRadius: 30,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  checkButton: {
    position: "absolute",
    bottom: 40,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  homeIcon: {
    width: 30,
    height: 30,
  },
});

export default Feedback;
