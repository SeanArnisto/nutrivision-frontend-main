import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useNutrientsStore } from "@/hooks/store";
import {
  View,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
} from "react-native";
import { useFonts } from "expo-font";
import * as MediaLibrary from "expo-media-library";
import PieChart from "react-native-pie-chart";
import AppLogo from "@/components/appLogo";
import NutrientInputSection from "@/components/NutrientInput";
import GoBack from "@/components/ReturnButton";
import GoNext from "@/components/NextButton";
import ProfileBox from "@/components/ProfileBox";


// Helper Function
const toPercentageText = (value: number): string => `${value}%`;
const formatValue = (value: number, unit: string = "g"): string =>
  `${value} ${unit}`;

export default function UserNutrientPage() {
  const carbohydrate = useNutrientsStore((state) => state.carbs);
  const protein = useNutrientsStore((state) => state.protein);
  const sodium = useNutrientsStore((state) => state.sodium);

  const [fontsLoaded] = useFonts({
    "SpaceMono-Regular": require("@/assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [capturedPhotos, setCapturedPhotos] = useState<
    { uri: string; type: string; orientation: string }[]
  >([]);
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    const carb = Number(carbohydrate) || 0;
    const prot = Number(protein) || 0;
    const sod = Number(sodium) || 0;

    const total = carb + prot + sod;
    if (total === 0) return;

    const pieCarb = parseFloat(((carb / total) * 100).toFixed(2));
    const pieProtein = parseFloat(((prot / total) * 100).toFixed(2));
    const pieSodium = parseFloat(((sod / total) * 100).toFixed(2));

    setNutrients({
      carbohydrate: carb.toString(),
      protein: prot.toString(),
      sodium: sod.toString(),
    });
    setNutritionData({
      userIntake: {
        breakdown: {
          carbohydrate: pieCarb,
          protein: pieProtein,
          sodium: pieSodium,
        },
        total: parseFloat(total.toFixed(2)),
      },
    });
  }, [carbohydrate, protein, sodium]);

  // State for nutrient inputs (now as numbers without units)
  const [nutrients, setNutrients] = useState({
    carbohydrate: "88",
    sodium: "1.83",
    protein: "3.5",
  });

  const [isEditing, setIsEditing] = useState({
    carbohydrate: false,
    sodium: false,
    protein: false,
  });

  interface NutritionData {
    userIntake: {
      breakdown: { carbohydrate: number; sodium: number; protein: number };
      total: number;
    };
  }

  const [nutritionData1, setNutritionData] = useState<NutritionData>({
    userIntake: {
      breakdown: { carbohydrate: 94, sodium: 2, protein: 4 },
      total: 93.33,
    },
  });

  // Toggle edit mode
  const toggleEdit = (key: "sodium" | "protein" | "carbohydrate") => {
    setIsEditing((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setCarbs = useNutrientsStore((state) => state.setCarbs);
  const setProtein = useNutrientsStore((state) => state.setProtein);
  const setSodium = useNutrientsStore((state) => state.setSodium);

  // Handle nutrient change
  // Handle nutrient change
  const handleNutrientChange = (
    key: "sodium" | "protein" | "carbohydrate",
    value: string
  ) => {
    // Special handling for decimal point
    if (value === "." || value === "0.") {
      // For decimal point only, just update the display value without converting
      const updatedNutrients = { ...nutrients, [key]: value };
      setNutrients(updatedNutrients);

      // Update the Zustand store with 0 for now
      if (key === "carbohydrate") setCarbs(0);
      if (key === "protein") setProtein(0);
      if (key === "sodium") setSodium(0);
      return;
    }

    const numValue = parseFloat(value) || 0;

    // Update the Zustand store
    if (key === "carbohydrate") setCarbs(numValue);
    if (key === "protein") setProtein(numValue);
    if (key === "sodium") setSodium(numValue);

    // Update the local nutrients state
    const updatedNutrients = { ...nutrients, [key]: value }; // Keep as string for display
    setNutrients(updatedNutrients);

    const total =
      (parseFloat(updatedNutrients.carbohydrate) || 0) +
      (parseFloat(updatedNutrients.protein) || 0) +
      (parseFloat(updatedNutrients.sodium) || 0);

    if (total === 0) return;

    const pieCarb = parseFloat(
      (
        ((parseFloat(updatedNutrients.carbohydrate) || 0) / total) *
        100
      ).toFixed(2)
    );
    const pieProtein = parseFloat(
      (((parseFloat(updatedNutrients.protein) || 0) / total) * 100).toFixed(2)
    );
    const pieSodium = parseFloat(
      (((parseFloat(updatedNutrients.sodium) || 0) / total) * 100).toFixed(2)
    );

    setNutritionData({
      userIntake: {
        breakdown: {
          carbohydrate: pieCarb,
          protein: pieProtein,
          sodium: pieSodium,
        },
        total: total,
      },
    });
  };

  console.log("carbs:", carbohydrate, "protein:", protein, "sodium:", sodium);

  // Request media library permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setMediaLibraryPermission(status === "granted");
    })();
  }, []);

  // Load previously captured photos on mount
  // Request media library permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setMediaLibraryPermission(status === "granted");
    })();
  }, []);

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

  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
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
            <AppLogo />

            <ProfileBox primaryText="Average" highlightedText="Intake"/>

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

            {/* Input section */}
            <NutrientInputSection
              nutrients={nutrients}
              isEditing={isEditing}
              handleNutrientChange={handleNutrientChange}
              toggleEdit={toggleEdit}
            />

            <View style={styles.chartsContainer}>
              {/* User Intake Donut Chart */}
              <View style={styles.chartBox}>
                <View style={styles.chartRow}>
                  <View style={styles.chartWrapper}>
                    <PieChart
                      widthAndHeight={150}
                      series={[
                        {
                          value: nutritionData1.userIntake.breakdown.protein,
                          color: "#000000",
                        },
                        {
                          value: nutritionData1.userIntake.breakdown.sodium,
                          color: "#c0b4b4",
                        },
                        {
                          value:
                            nutritionData1.userIntake.breakdown.carbohydrate,
                          color: "#7ca844",
                        },
                      ]}
                      cover={0.55}
                    />
                  </View>
                  <View style={styles.legendWrapper}>
                    <Text style={styles.chartTitle}>Your Intake</Text>
                    <View style={styles.legendItem}>
                      <View
                        style={[
                          styles.colorCircle,
                          { backgroundColor: "#7ca844" },
                        ]}
                      />
                      <Text style={styles.legendLabel}>
                        Carbs (
                        {toPercentageText(
                          nutritionData1.userIntake.breakdown.carbohydrate
                        )}
                        )
                      </Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View
                        style={[
                          styles.colorCircle,
                          { backgroundColor: "#c0b4b4" },
                        ]}
                      />
                      <Text style={styles.legendLabel}>
                        Sodium (
                        {toPercentageText(
                          nutritionData1.userIntake.breakdown.sodium
                        )}
                        )
                      </Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View
                        style={[
                          styles.colorCircle,
                          { backgroundColor: "#000000" },
                        ]}
                      />
                      <Text style={styles.legendLabel}>
                        Protein (
                        {toPercentageText(
                          nutritionData1.userIntake.breakdown.protein
                        )}
                        )
                      </Text>
                    </View>
                    <View style={styles.totalBox}>
                      <Text style={styles.totalText}>
                        Total Nutrient{"\n"}Amount ={" "}
                        {formatValue(nutritionData1.userIntake.total)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {/* navigations */}
      <GoBack />
      <GoNext next="page-6" />
    </SafeAreaView>
  );
}

const screenWidth = Dimensions.get("window").width;
const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
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
    height: 60,
    resizeMode: "contain",
    alignSelf: "flex-start",
  },
  userIntakeCard: {
    marginTop: -15,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    flexDirection: "row",
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  userText: {
    color: "#9AB206",
    fontSize: 14,
    fontWeight: "bold",
  },
  intakeText: {
    color: "#4D4444",
    fontSize: 14,
    fontWeight: "bold",
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
  inputSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
  },
  innerRow: {
    flexDirection: "row",
  },
  newLeftColumn: {
    flex: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  newRightColumn: {
    flex: 40,
    paddingLeft: 10,
    justifyContent: "center",
    gap: 6,
  },
  newLegendTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    marginLeft: -20,
  },
  newLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  newCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  newLegendText: {
    fontSize: 14,
    color: "#333",
  },
  newTotalBox: {
    backgroundColor: "#f8e4e4",
    marginTop: 10,
    padding: 10,
    borderRadius: 15,
    alignItems: "flex-start",
    marginLeft: -20,
  },
  newTotalText: {
    fontSize: 16,
    color: "#333",
    textAlign: "left",
  },
  chartsContainer: {
    gap: 16,
  },
  chartBox: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  chartRow: {
    flexDirection: "row",
  },
  chartWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  legendWrapper: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  legendItemSpacing: {
    marginLeft: 24, // Additional spacing for the second legend
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  colorCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 12,
  },
  legendLabel: {
    fontSize: 12,
    color: "#333",
  },
  totalBox: {
    backgroundColor: "#f8e4e4",
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  totalText: {
    fontSize: 14,
    color: "#333",
    textAlign: "left",
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
});
