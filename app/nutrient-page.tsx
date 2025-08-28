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
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFonts } from "expo-font";
import * as MediaLibrary from "expo-media-library";
import PieChart from "react-native-pie-chart";
import AppLogo from "@/components/appLogo";
import NutrientInputSection from "@/components/NutrientInput";
import GoBack from "@/components/ReturnButton";
import ProfileBox from "@/components/ProfileBox";
import NutritionDonutChart from "@/components/DonuteChart";
import PhotoThumbnailGallery from "@/components/PhotoThumbnailGallery";
import GoNext from "@/components/NextButton";

// Helper Function
const toPercentageText = (value: number): string => `${value}%`;
const formatValue = (value: number, unit: string = "g"): string =>
  `${value} ${unit}`;

export default function UserNutrientPage() {
  const carbohydrate = useNutrientsStore((state) => state.carbs);
  const protein = useNutrientsStore((state) => state.protein);
  const sodium = useNutrientsStore((state) => state.sodium);
  const saveWithPhotos = useNutrientsStore((state) => state.saveWithPhotos);
  const loading = useNutrientsStore((state) => state.loading);
  const error = useNutrientsStore((state) => state.error);
  const reset = useNutrientsStore((state) => state.reset);

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

  // Handle saving to database
  const handleSaveToDatabase = async () => {
    // Validate that we have nutrition data
    if (carbohydrate === 0 && protein === 0 && sodium === 0) {
      Alert.alert(
        "No Data", 
        "Please enter nutritional values before saving.",
        [{ text: "OK" }]
      );
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
                // Reset the form after successful save
                // reset();
                // setNutrients({
                //   carbohydrate: "0",
                //   sodium: "0",
                //   protein: "0",
                // });
                // setCapturedPhotos([]);
                // setNutritionData({
                //   userIntake: {
                //     breakdown: { carbohydrate: 0, sodium: 0, protein: 0 },
                //     total: 0,
                //   },
                // });
              }
            }
          ]
        );
      } else {
        Alert.alert("Error", result.error || "Failed to save data");
      }
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
      console.error("Save error:", error);
    }
  };

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
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <AppLogo />
            <ProfileBox primaryText="Average" highlightedText="Intake" />

            {/* Thumbnail section with added top margin */}
            <View style={{ marginTop: 20 }}>
              <PhotoThumbnailGallery
                photos={capturedPhotos}
                nutritionalData={{
                  carbs: parseFloat(nutrients.carbohydrate) || 0,
                  sodium: parseFloat(nutrients.sodium) || 0,
                  protein: parseFloat(nutrients.protein) || 0,
                  servings: 1 // or set dynamically if needed
                }}
              />
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
              <NutritionDonutChart
                nutritionData={nutritionData1.userIntake}
                title="Your Intake"
                chartSize={150}
                coverRadius={0.55}
                colors={{
                  protein: "#000000",
                  sodium: "#c0b4b4",
                  carbohydrate: "#7ca844",
                }}
                formatValue={formatValue}
                toPercentageText={toPercentageText}
              />
            </View>

            {/* Error Display */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Navigation */}
      <GoBack />
      <GoNext next="page-6"/>
      
      {/* Save Button instead of GoNext */}
      {/* <TouchableOpacity 
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
      </TouchableOpacity> */}
    </SafeAreaView>
  );
}

const screenWidth = Dimensions.get("window").width;
const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  chartsContainer: {
    gap: 16,
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
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginHorizontal: 20,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'SpaceMono-Regular',
  },
});