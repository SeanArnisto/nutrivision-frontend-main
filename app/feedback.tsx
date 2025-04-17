import React, { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
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
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useNavigation } from "expo-router";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import * as MediaLibrary from "expo-media-library";
import axios from "axios";
import { useRoute } from "@react-navigation/native";
import { FindTablespoons } from "./HelperFunctions";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "index"
>;

type protein = {
  protein: number;
  approxProtein: number;
  proteinTablespoon: number;
};
type sodium = {
  sodium: number;
  approxSodium: number;
  sodiumTablespoon: number;
};
type carbs = {
  carbs: number;
  approxCarbs: number;
  carbsTablepoon: number;
};

function Feedback() {
  const route = useRoute();
  const { data } = route.params as { data: any };
  const { nutritionData } = route.params as { nutritionData: any }; // Retrieve the passed data
  console.log("Data from page-2:", data);
  console.log("working page 6:", nutritionData); // Use this data in your UI

  const [carbsTablespoon, setCarbsTablespoon] = useState<carbs>({
    carbs: 0,
    approxCarbs: 0,
    carbsTablepoon: 0,
  });
  const [proteinTablespoon, setProteinTablespoon] = useState<protein>({
    protein: 0,
    approxProtein: 0,
    proteinTablespoon: 0,
  });
  const [sodiumTablespoon, setSodiumTablespoon] = useState<sodium>({
    sodium: 0,
    approxSodium: 0,
    sodiumTablespoon: 0,
  });
  const [requestMessage, setRequestMessage] = useState<string>(""); // Feedback message
  const [loading, setLoading] = useState<boolean>(true); // Loading state

  useEffect(() => {
    if (nutritionData?.nutrition_range && data?.combined) {
      const carbsMin = nutritionData.nutrition_range.carbs[0];
      const carbsMax = nutritionData.nutrition_range.carbs[1];
      const proteinMin = nutritionData.nutrition_range.protein[0];
      const proteinMax = nutritionData.nutrition_range.protein[1];
      const sodiumMin = nutritionData.nutrition_range.sodium[0];
      const sodiumMax = nutritionData.nutrition_range.sodium[1];

      const parseGrams = (value: string | undefined): number => {
        if (!value) return 0;
        if (value.toLowerCase().includes("mg")) {
          return parseFloat(value) / 1000;
        }
        return parseFloat(value);
      };

      const carbohydrate = parseGrams(data.combined.carbs_total);
      const protein = parseGrams(data.combined.protein_total);
      const sodium = parseGrams(data.combined.sodium_total);

      setCarbsTablespoon({
        carbs: carbohydrate,
        approxCarbs: 0,
        carbsTablepoon: FindTablespoons(carbohydrate, carbsMin, carbsMax),
      });
      setProteinTablespoon({
        protein,
        approxProtein: 0,
        proteinTablespoon: FindTablespoons(protein, proteinMin, proteinMax),
      });
      setSodiumTablespoon({
        sodium,
        approxSodium: 0,
        sodiumTablespoon: FindTablespoons(sodium, sodiumMin, sodiumMax),
      });
    }
  }, [nutritionData, data]);

  const fetchFeedback = async () => {
    try {
      setLoading(true); // Start loading
      const response = await axios.post(
        "https://pel1-recommendation.hf.space/get-nutrient-feedback",
        {
          carbs_total: carbsTablespoon.carbs, // User's carbohydrate intake
          sodium_total: sodiumTablespoon.sodium, // User's sodium intake
          protein_total: proteinTablespoon.protein, // User's protein intake
          recommended_carbs: nutritionData.nutrition_range.carbs, // Recommended range for carbohydrates
          recommended_sodium: nutritionData.nutrition_range.sodium, // Recommended range for sodium
          recommended_protein: nutritionData.nutrition_range.protein, // Recommended range for protein
        }
      );

      if (response.data && response.data.feedback) {
        const { comparison_analysis, range_assessment, health_implications } =
          response.data.feedback;
        setRequestMessage(
          `${comparison_analysis}\n\n${range_assessment}\n\n${health_implications}`
        );
      } else {
        setRequestMessage("No feedback available.");
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      setRequestMessage("Error fetching feedback.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  useEffect(() => {
    fetchFeedback(); // Fetch feedback on component mount
  }, []);

  const navigation = useNavigation() as HomeScreenNavigationProp;
  const [capturedPhotos, setCapturedPhotos] = useState<
    { uri: string; type: string; orientation: string }[]
  >([]);
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState<
    boolean | null
  >(null);

  // Request media library permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setMediaLibraryPermission(status === "granted");
    })();
  }, []);

  // Load previously captured photos on mount
  useFocusEffect(
    useCallback(() => {
      if (mediaLibraryPermission) {
        loadRecentPhotos();
      }

      return () => {
        // Optional: reset or cancel something if needed
        console.log("Leaving the screen");
      };
    }, [mediaLibraryPermission])
  );

  const loadRecentPhotos = async () => {
    try {
      // First, get the NutriVision album
      const album = await MediaLibrary.getAlbumAsync("NutriVision");

      // If the album doesn't exist yet, return empty array
      if (!album) {
        console.log("NutriVision album not found");
        setCapturedPhotos([]);
        return;
      }

      // Get assets from the NutriVision album specifically
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

  const handleCheck = () => {
    navigation.navigate("page-2", { nutritionData });
  };

  const testRequest = async () => {
    const [response, setResponse] = useState("");

    const handleSubmit = () => {
      // axios.get()
    };
  };

  function SpoonImages({ spoonDisplay }: { spoonDisplay: number }) {
    let imageToDisplay = require("@/assets/images/neutral.png"); // Default image
    switch (spoonDisplay) {
      case 1: // oneGreen
        imageToDisplay = require("@/assets/images/1green.png");
        break;

      case 2: // twoGreen
        imageToDisplay = require("@/assets/images/2green.png");
        break;

      case 3: // threeGreen
        imageToDisplay = require("@/assets/images/3green.png");
        break;

      case 4: // fourGreen
        imageToDisplay = require("@/assets/images/4green.png");
        break;

      case 5: // fiveGreen
        imageToDisplay = require("@/assets/images/5green.png");
        break;

      case 6: // fiveGreenPlus
        imageToDisplay = require("@/assets/images/5greenwithplus.png");
        break;

      case 7: // oneRed
        imageToDisplay = require("@/assets/images/1red.png");
        break;

      case 8: // twoRed
        imageToDisplay = require("@/assets/images/2red.png");
        break;

      case 9: // threeRed
        imageToDisplay = require("@/assets/images/3red.png");
        break;

      case 10: // fourRed
        imageToDisplay = require("@/assets/images/4red.png");
        break;

      case 11: // fiveRed
        imageToDisplay = require("@/assets/images/5red.png");
        break;

      case 12: // fiveRedPlus
        imageToDisplay = require("@/assets/images/5redwithplus.png");
        break;

      case 13: // oneGreenLess
        imageToDisplay = require("@/assets/images/1greenwithless.png");
        break;

      case 14: // oneRedLess
        imageToDisplay = require("@/assets/images/1redwithless.png");
        break;
    }

    return (
      <View style={styles.rightContainer}>
        <Image source={imageToDisplay} style={styles.image} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0} // Adjust as needed
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Image
                source={require("@/assets/images/NutriVision.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            {/* Thumbnail section */}
            <View style={styles.thumbnailSection}>
              <View style={styles.thumbnailWrapper}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailsRow}
                >
                  {capturedPhotos.map((item, index) => (
                    <View key={index} style={styles.thumbnailContainer}>
                      {item.uri ? (
                        <Image
                          source={{ uri: item.uri }}
                          style={styles.thumbnail}
                          onError={() => console.log("Image failed to load")}
                        />
                      ) : (
                        <View style={styles.thumbnail}>
                          <Text style={styles.placeholderText}>No Image</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* protein table */}
            <View style={styles.sugarContainer}>
              <View style={styles.textContainer}>
                <Text style={styles.textHeader}>
                  Protein: {proteinTablespoon.protein} g
                </Text>
                <Text style={styles.textSubHeader}>
                  Approx Protein: 0 grams
                </Text>
                <Text style={styles.textSubHeader}>
                  Equivalent to: 0 tablespoons
                </Text>
              </View>
              <SpoonImages spoonDisplay={proteinTablespoon.proteinTablespoon} />
            </View>
            {/* sodium table */}
            <View style={styles.sugarContainer}>
              <View style={styles.textContainer}>
                <Text style={styles.textHeader}>
                  Sodium: {sodiumTablespoon.sodiumTablespoon} g
                </Text>
                <Text style={styles.textSubHeader}>Approx Sodium: 0 grams</Text>
                <Text style={styles.textSubHeader}>
                  Equivalent to: 0 tablespoons
                </Text>
              </View>
              <SpoonImages spoonDisplay={sodiumTablespoon.sodiumTablespoon} />
            </View>
            {/* carbs table */}
            <View style={styles.sugarContainer}>
              <View style={styles.textContainer}>
                <Text style={styles.textHeader}>
                  Carbs: {carbsTablespoon.carbs} g
                </Text>
                <Text style={styles.textSubHeader}>Approx carbs: 0 grams</Text>
                <Text style={styles.textSubHeader}>
                  Equivalent to: 0 tablespoons
                </Text>
              </View>
              <SpoonImages spoonDisplay={carbsTablespoon.carbsTablepoon} />
            </View>
            <View style={styles.FeedbackContainer}>
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
      <TouchableOpacity
        style={styles.checkButton}
        onPress={handleCheck}
        disabled={false}
      >
        <Image
          source={require("@/assets/images/Home.png")}
          style={{ width: 30, height: 30 }} // Adjust the size as needed
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  image: {
    width: SCREEN_WIDTH * 0.35, // Responsive width (25% of screen)
    height: 50,
    resizeMode: "contain",
    backgroundColor: "white",
  },
  rightContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 5,
    backgroundColor: "white",
  },
  sugarContainer: {
    flexDirection: "row",
    width: SCREEN_WIDTH * 0.9,
    height: 70,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: "space-between", // Changed from 'center' to better distribute content
    alignItems: "center", // Added to vertically center items
    backgroundColor: "white", // Match the container background color
    // Use platform-specific styling for consistent shadows
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
    paddingHorizontal: 15, // Add some horizontal padding
    marginBottom: 15, // Add some margin between items
  },
  FeedbackContainer: {
    flexDirection: "row",
    width: SCREEN_WIDTH * 0.9,
    height: 320,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: "space-between", // Changed from 'center' to better distribute content
    alignItems: "center", // Added to vertically center items
    backgroundColor: "white", // Match the container background color
    // Use platform-specific styling for consistent shadows
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
    paddingHorizontal: 15, // Add some horizontal padding
    marginBottom: 15, // Add some margin between items
  },
  textHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4D4444",
    paddingBottom: 1,
    paddingLeft: -5,
  },
  textContainer: {
    flex: 1, // Take available space
    backgroundColor: "white",
  },
  textSubHeader: {
    fontSize: 12,
    color: "#9D9696",
    paddingLeft: -5,
  },
  safeContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Add space for floating button
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 20,
  },
  header: {
    marginLeft: -15,
    width: "100%",
    height: 100,
    justifyContent: "center",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  logo: {
    width: 200,
    height: 150,
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
  placeholderText: {
    color: "gray",
    fontSize: 10,
    textAlign: "center",
    marginTop: 20,
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
  checkMark: {
    fontSize: 25,
    color: "#9AB206",
    fontWeight: "bold",
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
});

export default Feedback;
