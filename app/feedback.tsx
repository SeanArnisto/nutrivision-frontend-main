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
  ActivityIndicator
} from "react-native";
import { useNavigation } from "expo-router";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import * as MediaLibrary from "expo-media-library";
import { useRecommStore, useNutrientsStore } from "@/hooks/store";
import {
  useNutritionAverage,
  fetchNutritionAverage,
} from "@/stores/nutritionIntakeStore";
import { Ionicons } from "@expo/vector-icons";
import AppLogo from "@/components/appLogo";

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

  // Nutrition average store for better recommendation ranges
  const {
    nutritionDataAve,
    isLoading: nutritionAveLoading,
    error: nutritionAveError,
    fetchNutritionIntakeAve,
  } = useNutritionAverage();

  const [comparisonAnalysis, setComparisonAnalysis] = useState<string>("");
  const [healthImplication, setHealthImplication] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState<
    boolean | null
  >(null);
  const [photosLoading, setPhotosLoading] = useState<boolean>(true);
  const [capturedPhotos, setCapturedPhotos] = useState<
    { uri: string; type: string; orientation: string; id: string }[]
  >([]);

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
    try {
      const album = await MediaLibrary.getAlbumAsync("NutriVision");

      if (!album) {
        console.log("NutriVision album not found");
        setCapturedPhotos([]);
        return;
      }

      const { assets } = await MediaLibrary.getAssetsAsync({
        album: album.id,
        first: 5,
        mediaType: "photo",
        sortBy: ["creationTime"],
      });

      const recentPhotos = [];
      for (const asset of assets) {
        let uriToUse = asset.uri;
        if (Platform.OS === "ios" && uriToUse.startsWith("ph://")) {
          try {
            const info = await MediaLibrary.getAssetInfoAsync(asset);
            if (info.localUri) {
              uriToUse = info.localUri;
            }
          } catch (error) {
            console.error("Error getting localUri for asset:", error);
          }
        }

        recentPhotos.push({
          uri: uriToUse,
          type: Math.random() > 0.5 ? "label" : "fruit",
          orientation: Math.random() > 0.5 ? "vertical" : "horizontal",
          id: asset.id,
        });
      }

      setCapturedPhotos(
        recentPhotos.filter(
          (photo) => photo.uri && typeof photo.uri === "string"
        )
      );
    } catch (error) {
      console.error("Error loading photos from NutriVision album:", error);
    }
  };

  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true);

      // Use nutrition average data as fallback if regular recommendations aren't available
      const useNutritionAve =
        !(
          minCarb > 0 &&
          maxCarb > 0 &&
          minProtein > 0 &&
          maxProtein > 0 &&
          minSodium > 0 &&
          maxSodium > 0
        ) && nutritionDataAve;

      const finalMinCarb = useNutritionAve
        ? nutritionDataAve!.minCarbs
        : minCarb;
      const finalMaxCarb = useNutritionAve
        ? nutritionDataAve!.maxCarbs
        : maxCarb;
      const finalMinProtein = useNutritionAve
        ? nutritionDataAve!.minProtein
        : minProtein;
      const finalMaxProtein = useNutritionAve
        ? nutritionDataAve!.maxProtein
        : maxProtein;
      const finalMinSodium = useNutritionAve
        ? nutritionDataAve!.minSodium
        : minSodium;
      const finalMaxSodium = useNutritionAve
        ? nutritionDataAve!.maxSodium
        : maxSodium;

      const requestData = {
        carbs_total: carbs,
        sodium_total: sod * 1000, // Convert g to mg
        protein_total: prot,
        recommended_carbs: [finalMinCarb, finalMaxCarb],
        recommended_sodium: [finalMinSodium, finalMaxSodium],
        recommended_protein: [finalMinProtein, finalMaxProtein],
      };

      console.log("Sending feedback request:", requestData);

      const response = await fetch(
        "https://pel1-feedback-llm.hf.space/get-response",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `HTTP error! status: ${response.status}, response:`,
          errorText
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received feedback response:", data);

      if (data && data.feedback) {
        const { comparison_analysis, health_implication } = data.feedback;
        setComparisonAnalysis(
          comparison_analysis || "No comparison analysis available."
        );
        setHealthImplication(
          health_implication || "No health implications available."
        );
      } else {
        setComparisonAnalysis(
          "No feedback available. If values are 0, make sure to manually input them."
        );
        setHealthImplication(
          "No feedback available. If values are 0, make sure to manually input them."
        );
      }
    } catch (error) {
      console.error("Feedback fetch error:", error);
      if (error instanceof Error && error.message.includes("500")) {
        setComparisonAnalysis(
          "The feedback service is currently experiencing issues. Your nutritional data has been recorded and displayed above."
        );
        setHealthImplication(
          "Unable to generate health implications at this time due to a server error. Please try again later."
        );
      } else {
        setComparisonAnalysis(
          "Unable to connect to feedback service. Please check your internet connection and try again."
        );
        setHealthImplication(
          "Unable to connect to feedback service. Please check your internet connection and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [
    carbs,
    prot,
    sod,
    minCarb,
    maxCarb,
    minProtein,
    maxProtein,
    minSodium,
    maxSodium,
    nutritionDataAve,
  ]);

  const carbohydrate = useNutrientsStore((state) => state.carbs);
  const protein = useNutrientsStore((state) => state.protein);
  const sodium = useNutrientsStore((state) => state.sodium);
  const saveWithPhotos = useNutrientsStore((state) => state.saveWithPhotos);
  const reset = useNutrientsStore((state) => state.reset);

  const deleteAllCapturedPhotos = useCallback(async (photos: { uri: string; type: string; orientation: string; id: string }[]) => {
      console.log("🗑️ Starting cleanup of captured photos...");
      
      if (!photos || photos.length === 0) {
        console.log("No photos to delete");
        return;
      }
  
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          console.warn("Media library permission not granted, skipping photo cleanup");
          // Still clear the state even if we can't delete from storage
          setCapturedPhotos([]);
          return;
        }
  
        // Extract asset IDs from photos (now guaranteed to have ID since we store them)
        const assetIds = photos.map(photo => photo.id);
        
        // Delete the assets from device storage using the asset IDs directly
        if (assetIds.length > 0) {
          console.log(`Deleting ${assetIds.length} photos from device storage using asset IDs`);
          const deleteSuccess = await MediaLibrary.deleteAssetsAsync(assetIds);
          
          if (deleteSuccess) {
            console.log("✅ Successfully deleted photos from device storage");
          } else {
            console.warn("⚠️ Some photos may not have been deleted from storage");
          }
        }
  
        // Clear the state regardless of deletion success
        setCapturedPhotos([]);
        console.log("✅ Cleared captured photos from UI");
  
      } catch (error) {
        console.error("❌ Error during photo cleanup:", error);
        // Even if deletion fails, clear the UI state
        setCapturedPhotos([]);
        console.log("⚠️ Cleared UI state despite cleanup errors");
      }
    }, []);
  

  const handleSaveToDatabase = async () => {
    // Validate that we have nutrition data
    if (carbohydrate === 0 && protein === 0 && sodium === 0) {
      Alert.alert("No Data", "Please enter nutritional values before saving.", [
        { text: "OK" },
      ]);
      return;
    }

    try {
      const result = await saveWithPhotos(capturedPhotos);

      if (result.success) {
        Alert.alert(
          "Success",
          "Nutritional data and photos saved successfully!",
          [
            {
              text: "OK",
              onPress: () => {                
                reset();
                setCapturedPhotos([]);
              },
            },
          ]
        );
        await deleteAllCapturedPhotos(capturedPhotos)
        navigation.navigate("page-2")
      } else {
        Alert.alert("Error", result.error || "Failed to save data");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
      console.error("Save error:", error);
    }
  };

  // Fetch feedback when nutrient values change
  useEffect(() => {
    // Debug: Log all recommendation values
    console.log("Recommendation values:", {
      minCarb,
      maxCarb,
      minProtein,
      maxProtein,
      minSodium,
      maxSodium,
    });

    console.log("Nutrition average data:", nutritionDataAve);

    // Check if recommendation ranges are valid (not zero)
    const hasValidRecommendations =
      minCarb > 0 &&
      maxCarb > 0 &&
      minProtein > 0 &&
      maxProtein > 0 &&
      minSodium > 0 &&
      maxSodium > 0;

    // Check if we have valid nutrition average data as fallback
    const hasValidNutritionAve =
      nutritionDataAve &&
      nutritionDataAve.minCarbs > 0 &&
      nutritionDataAve.maxCarbs > 0 &&
      nutritionDataAve.minProtein > 0 &&
      nutritionDataAve.maxProtein > 0 &&
      nutritionDataAve.minSodium > 0 &&
      nutritionDataAve.maxSodium > 0;

    console.log("hasValidRecommendations:", hasValidRecommendations);
    console.log("hasValidNutritionAve:", hasValidNutritionAve);

    if (hasValidRecommendations || hasValidNutritionAve) {
      fetchFeedback();
    } else {
      setComparisonAnalysis(
        "Recommendation ranges are not properly set. Please configure your dietary recommendations in settings."
      );
      setHealthImplication(
        "Recommendation ranges are not properly set. Please configure your dietary recommendations in settings."
      );
      setLoading(false);
    }
  }, [fetchFeedback]);

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
              {loading ? (
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

      {/* <TouchableOpacity style={styles.checkButton} onPress={() => navigation.navigate("page-2")}>
        <Image
          source={require("@/assets/images/Home.png")}
          style={styles.homeIcon}
        />
      </TouchableOpacity> */}
       <TouchableOpacity 
        style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
        onPress={handleSaveToDatabase}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.saveButtonText}>Save to Database</Text>
        )}
      </TouchableOpacity> 
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#eff1f6",
  },
  saveButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: '#7ca844',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    minWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
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
    backgroundColor: '#c0b4b4',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SpaceMono-Regular',
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
