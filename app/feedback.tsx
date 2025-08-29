import React, { useCallback, useEffect, useState } from "react";
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
} from "react-native";
import { useNavigation } from "expo-router";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import * as MediaLibrary from "expo-media-library";
import axios from "axios";
import { useRecommStore } from "@/hooks/store";
import { useNutrientsStore } from "@/hooks/store";
import { Ionicons } from "@expo/vector-icons";
import  AppLogo  from "@/components/appLogo";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "index"
>;

// Helper function to convert grams to tablespoon equivalent
const getTablespoonEquivalent = (grams: number, isNutrient: 'carbs' | 'protein' | 'sodium'): string => {
  const tablespoons = grams / 15;
  
  if (isNutrient === 'sodium') {
    // Sodium is usually much smaller amounts
    if (tablespoons < 0.25) {
      return 'less than ¼ tbsp';
    } else if (tablespoons < 0.5) {
      return '¼ tbsp';
    } else if (tablespoons < 1) {
      return '½ tbsp';
    } else {
      const rounded = Math.round(tablespoons * 4) / 4; // Round to nearest quarter
      return `${rounded} tbsp${rounded > 1 ? 's' : ''}`;
    }
  }
  
  // For carbs and protein
  if (tablespoons < 1) {
    return 'less than 1 tbsp';
  } else {
    const rounded = Math.round(tablespoons);
    return `${rounded} tbsp${rounded > 1 ? 's' : ''}`;
  }
};

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

  const [requestMessage, setRequestMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [capturedPhotos, setCapturedPhotos] = useState<{ uri: string }[]>([]);
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState<boolean | null>(null);
  const [photosLoading, setPhotosLoading] = useState<boolean>(true);

  const navigation = useNavigation() as HomeScreenNavigationProp;

  // Request media library permissions
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setMediaLibraryPermission(status === "granted");
    })();
  }, []);

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
      setPhotosLoading(true);
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

        recentPhotos.push({ uri: uriToUse });
      }

      setCapturedPhotos(
        recentPhotos.filter(photo => photo.uri && typeof photo.uri === "string")
      );
    } catch (error) {
      console.error("Error loading photos from NutriVision album:", error);
    } finally {
      setPhotosLoading(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        "https://pel1-recommendation.hf.space/get-nutrient-feedback",
        {
          carbs_total: carbs,
          sodium_total: sod * 1000, // Convert g to mg
          protein_total: prot,
          recommended_carbs: [minCarb, maxCarb],
          recommended_sodium: [minSodium, maxSodium],
          recommended_protein: [minProtein, maxProtein],
        }
      );

      if (response.data && response.data.feedback) {
        const { comparison_analysis, range_assessment, health_implications } = response.data.feedback;
        setRequestMessage(
          `${comparison_analysis}\n\n${range_assessment}\n\n${health_implications}`
        );
      } else {
        setRequestMessage("No feedback available. If values are 0, make sure to manually input them.");
      }
    } catch (error) {
      console.error("Feedback fetch error:", error);
      setRequestMessage("Error fetching feedback. If values are 0, make sure to manually input them.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch feedback when nutrient values change
  useEffect(() => {
    if (carbs !== 0 && prot !== 0 && sod !== 0) {
      fetchFeedback();
    } else {
      setRequestMessage(
        "Some nutrient values are detected to be 0. To maximize the feedback result, make sure to manually input the possible amount of nutrients."
      );
      setLoading(false);
    }
  }, [carbs, prot, sod]);

  // Spoon visualization component
  // Spoons turn GREEN when the value is within the min-max range
  // Spoons turn RED when the value is outside the min-max range (too low or too high)
  const SpoonVisualization = ({ value, minIntake, maxIntake }: { 
    value: number; 
    minIntake: number; 
    maxIntake: number; 
  }) => {
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
        return isInGoodRange ? 'green' : 'red';
      }
      return 'gray';
    });

    const getSpoonImage = (state: string) => {
      switch (state) {
        case 'green':
          return require("@/assets/images/spoongreen.png");
        case 'red':
          return require("@/assets/images/spoonred.png");
        default:
          return require("@/assets/images/spoongray.png");
      }
    };

    return (
      <View style={styles.rightContainer}>
        <View style={styles.spoonContainer}>
          {spoonStates.map((state, index) => (
            <Image
              key={index}
              source={getSpoonImage(state)}
              style={styles.individualSpoon}
            />
          ))}
          {showLessThanSign && (
            <Text style={[
              styles.lessThanSign, 
              { color: isInGoodRange ? '#4CAF50' : '#F44336' }
            ]}>
              &lt;
            </Text>
          )}
          {showPlusSign && (
            <Text style={[
              styles.plusSign, 
              { color: isInGoodRange ? '#4CAF50' : '#F44336' }
            ]}>
              +
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            {/* Header with App Logo */}
              <AppLogo />


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
                    <Text style={styles.placeholderText}>No photos available</Text>
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
                  {getTablespoonEquivalent(carbs, 'carbs')}
                </Text>
              </View>
              <SpoonVisualization 
                value={carbs} 
                minIntake={minCarb} 
                maxIntake={maxCarb} 
              />
            </View>

            {/* Sodium Display */}
            <View style={styles.nutrientContainer}>
              <View style={styles.textContainer}>
                <Text style={styles.textHeader}>Sodium: {sod}g</Text>
                <Text style={styles.textSubHeader}>
                  {getTablespoonEquivalent(sod, 'sodium')}
                </Text>
              </View>
              <SpoonVisualization 
                value={sod} 
                minIntake={minSodium} 
                maxIntake={maxSodium} 
              />
            </View>

            {/* Protein Display */}
            <View style={styles.nutrientContainer}>
              <View style={styles.textContainer}>
                <Text style={styles.textHeader}>Protein: {prot}g</Text>
                <Text style={styles.textSubHeader}>
                  {getTablespoonEquivalent(prot, 'protein')}
                </Text>
              </View>
              <SpoonVisualization 
                value={prot} 
                minIntake={minProtein} 
                maxIntake={maxProtein} 
              />
            </View>

            {/* Feedback Section */}
            <View style={styles.feedbackContainer}>
              <ScrollView
                style={styles.feedbackScroll}
                contentContainerStyle={styles.feedbackContent}
              >
                {loading ? (
                  <Text style={styles.loadingText}>Generating feedback...</Text>
                ) : (
                  <Text style={styles.feedbackText}>{requestMessage}</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Navigation Buttons */}
      <TouchableOpacity style={styles.roundButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-undo-outline" size={28} color="#9AB206" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.checkButton} onPress={() => navigation.pop(5)}>
        <Image
          source={require("@/assets/images/Home.png")}
          style={styles.homeIcon}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 20,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  individualSpoon: {
    width: 40,
    height: 30,
    marginLeft: -18,
  },
  plusSign: {
    fontSize: 24,
    marginTop: 20,
    textAlign: 'center',
    marginLeft: -10
  },
  lessThanSign: {
    fontSize: 24,
    marginTop: 20,
    marginLeft: -10,
    textAlign: 'center',
  },
  feedbackContainer: {
    flexDirection: "row",
    width: SCREEN_WIDTH * 0.9,
    height: 320,
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