import React, { useRef, useState, useEffect, useCallback } from "react";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Image,
  ScrollView,
  Platform,
  Dimensions,
  Linking,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as ImageManipulator from "expo-image-manipulator";
import { useNavigation } from "@react-navigation/native";
import { useNutrientsStore } from "@/hooks/store";
import axios from "axios";
import PhotoPreviewSection from "@/components/PhotoPreviewSection";
import { useRoute } from "@react-navigation/native";
import Loading from "./loading";
import { useAuthStore } from "@/stores/authStore";
import { usePhotosStore } from "@/stores/usePhotoStore";
import { useDetailedNutrientStore } from "@/stores/useDetailedNutrientStore";
import CustomModal from "@/components/customModal";
import Toast from "@/components/Toast";

const { height, width: screenWidth } = Dimensions.get("window");

// SegmentedControl Component (Integrated)
const SEGMENTED_WIDTH = screenWidth * 0.85;
const SEGMENT_WIDTH = SEGMENTED_WIDTH / 3;

// Enhanced Photo Submission Service (MOVED OUTSIDE COMPONENT)
class PhotoSubmissionService {
  constructor() {
    this.maxRetries = 3;
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.timeout = 30000; // 30 seconds
  }

  validatePhotos(photos) {
    const errors = [];

    if (!photos || photos.length === 0) {
      errors.push("No photos selected");
      return { isValid: false, errors };
    }

    if (photos.length > 10) {
      errors.push("Too many photos (max 10)");
    }

    photos.forEach((photo, index) => {
      if (!photo.uri) {
        errors.push(`Photo ${index + 1}: Missing URI`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async optimizeImage(photo) {
    try {
      const shouldCompress = photo.width > 1920 || photo.height > 1920;

      if (shouldCompress) {
        const optimized = await ImageManipulator.manipulateAsync(
          photo.uri,
          [
            {
              resize: {
                width: Math.min(photo.width, 1920),
                height: Math.min(photo.height, 1920),
              },
            },
          ],
          {
            compress: 0.8,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );
        return optimized;
      }

      return photo;
    } catch (error) {
      console.warn("Image optimization failed, using original:", error);
      return photo;
    }
  }

  async createFormData(photos) {
    const formData = new FormData();

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];

      // Skip optimization for now to maintain compatibility
      // const optimizedPhoto = await this.optimizeImage(photo);

      const uriParts = photo.uri.split(".");
      const fileType = uriParts[uriParts.length - 1] || "jpg";

      const fileObject = {
        uri: photo.uri,
        name: `photo_${i}.${fileType}`,
        type: `image/${fileType === "jpg" ? "jpeg" : fileType}`,
      };

      formData.append("files", fileObject);
    }

    return formData;
  }

  async submitWithRetry(
    url,
    formData,
    headers,
    retryCount = 0,
    onProgress = null
  ) {
    try {
      console.log(
        `🚀 Making request attempt ${retryCount + 1} with progress tracking:`,
        !!onProgress
      );

      const response = await axios.post(url, formData, {
        headers,
        timeout: this.timeout,
        onUploadProgress: (progressEvent) => {
          console.log("📡 Raw progress event:", progressEvent); // Debug log

          if (onProgress && progressEvent.total > 0) {
            // Ensure progress never exceeds 100% and handle edge cases
            const loaded = Math.min(progressEvent.loaded, progressEvent.total);
            const percentCompleted = Math.min(
              Math.round((loaded * 100) / progressEvent.total),
              100
            );
            console.log(`🔄 Calling onProgress with ${percentCompleted}%`); // Debug log
            onProgress(percentCompleted);
          } else {
            console.warn("⚠️ No progress callback or invalid total:", {
              hasCallback: !!onProgress,
              total: progressEvent?.total,
            });
          }
        },
      });

      return response;
    } catch (error) {
      if (retryCount < this.maxRetries && this.shouldRetry(error)) {
        console.log(`Retry attempt ${retryCount + 1}/${this.maxRetries}`);
        await this.delay(1000 * (retryCount + 1));
        return this.submitWithRetry(
          url,
          formData,
          headers,
          retryCount + 1,
          onProgress
        );
      }
      throw error;
    }
  }

  shouldRetry(error) {
    if (error.code === "ECONNABORTED") return true;
    if (error.response?.status >= 500) return true;
    if (error.response?.status === 429) return true;
    return false;
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getErrorMessage(error) {
    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please check your connection and try again.";
    }

    if (error.response) {
      switch (error.response.status) {
        case 400:
          return "Invalid image format. Please try different photos.";
        case 413:
          return "Images too large. Please use smaller photos.";
        case 429:
          return "Too many requests. Please wait a moment and try again.";
        case 500:
          return "Server error. Please try again later.";
        default:
          return `Server error (${error.response.status}). Please try again.`;
      }
    }

    if (error.request) {
      return "Network error. Please check your connection.";
    }

    return "An unexpected error occurred. Please try again.";
  }
}

// Create a singleton instance
const submissionService = new PhotoSubmissionService();

const SegmentedControl = ({
  selectedIndex = 0,
  onSelectionChange,
  containerStyle,
  activeColor = "#4CAF50",
  inactiveColor = "#999",
  backgroundColor = "rgba(0,0,0,0.6)",
  textActiveColor = "white",
  textInactiveColor = "#4e4242ff",
}) => {
  const options = [
    {
      key: "labels",
      label: "Labels",
      icon: "document-text-outline",
    },
    {
      key: "fruits",
      label: "Fruits",
      icon: "leaf-outline",
    },
    {
      key: "both",
      label: "Both",
      icon: "git-network-outline",
    },
  ];

  const handlePress = (index) => {
    if (onSelectionChange) {
      onSelectionChange(index, options[index].key);
    }
  };

  return (
    <View
      style={[segmentedStyles.container, { backgroundColor }, containerStyle]}
    >
      <View
        style={[
          segmentedStyles.highlight,
          {
            backgroundColor: activeColor,
            transform: [{ translateX: selectedIndex * SEGMENT_WIDTH }],
            width: SEGMENT_WIDTH - 8,
          },
        ]}
      />
      <View style={segmentedStyles.optionsContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={option.key}
            style={segmentedStyles.option}
            onPress={() => handlePress(index)}
            activeOpacity={0.8}
          >
            <View style={segmentedStyles.optionContent}>
              <Ionicons
                name={option.icon}
                size={18}
                color={
                  selectedIndex === index ? textActiveColor : textInactiveColor
                }
              />
              <Text
                style={[
                  segmentedStyles.optionText,
                  {
                    color:
                      selectedIndex === index
                        ? textActiveColor
                        : textInactiveColor,
                  },
                ]}
              >
                {option.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Main Camera Component
export default function Camera() {
  const route = useRoute();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(0);
  //const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submit, setSubmit] = useState(false);
  const [previewLayout, setPreviewLayout] = useState({ width: 0, height: 0 });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [toast, setToast] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
  });

  const showToast = (type, title, message) => {
    setToast({ visible: true, type, title, message });

    setTimeout(() => {
      setToast({ visible: false, type: "", title: "", message: "" });
    }, 3000);
  };

  const {
    capturedPhotos,
    addPhoto,
    removePhoto,
    setPhotos,
    hasMaxPhotos,
    clearAllPhotos,
  } = usePhotosStore();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthenticated) {
      navigation.replace("login");
    }
  }, [isAuthenticated, navigation]);

  const isLabelMode = selectedSegmentIndex === 0;
  const isFruitMode = selectedSegmentIndex === 1;
  const isBothMode = selectedSegmentIndex === 2;

  const setCarbs = useNutrientsStore((state) => state.setCarbs);
  const setProtein = useNutrientsStore((state) => state.setProtein);
  const setSodium = useNutrientsStore((state) => state.setSodium);

  const facing = "back";
  const cameraRef = useRef(null);

  // Function to delete all captured photos after successful submission
  const deleteAllCapturedPhotos = useCallback(
    async (photos) => {
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
            clearAllPhotos(); // Clear from store
            return;
          }

          const album = await MediaLibrary.getAlbumAsync("NutriVision");
          if (!album) {
            console.log("NutriVision album not found, clearing store only");
            clearAllPhotos(); // Clear from store
            return;
          }

          // Get all assets in the album
          const { assets } = await MediaLibrary.getAssetsAsync({
            album: album.id,
            mediaType: ["photo"],
          });

          const photosToDelete = [];

          // Find assets that match our captured photos
          for (const photo of photos) {
            if (photo.id) {
              // Try to find by ID first
              const asset = assets.find((a) => a.id === photo.id);
              if (asset) {
                photosToDelete.push(asset.id);
                continue;
              }
            }

            // Fallback: try to match by URI
            const cleanPhotoUri = photo.uri
              .replace("ph://", "")
              .replace("file://", "")
              .split("?")[0]
              .split("#")[0];

            const asset = assets.find((a) => {
              const assetUri = a.uri
                .replace("ph://", "")
                .replace("file://", "")
                .split("?")[0]
                .split("#")[0];
              return assetUri === cleanPhotoUri;
            });

            if (asset) {
              photosToDelete.push(asset.id);
            }
          }

          // Delete the assets from device storage
          if (photosToDelete.length > 0) {
            console.log(
              `Deleting ${photosToDelete.length} photos from device storage`
            );
            const deleteSuccess = await MediaLibrary.deleteAssetsAsync(
              photosToDelete
            );

            if (deleteSuccess) {
              console.log("✅ Successfully deleted photos from device storage");
            } else {
              console.warn(
                "⚠️ Some photos may not have been deleted from storage"
              );
            }
          }

          // Clear the store regardless of deletion success
          clearAllPhotos();
          console.log("✅ Cleared captured photos from store");
        } else {
          // Android: Only clear from store (no MediaLibrary operations)
          clearAllPhotos();
          console.log("✅ Cleared captured photos from Android store");
        }
      } catch (error) {
        console.error("❌ Error during photo cleanup:", error);
        // Even if deletion fails, clear the store
        clearAllPhotos();
        console.log("⚠️ Cleared store despite cleanup errors");
      }
    },
    [clearAllPhotos]
  );

  // ENHANCED SUBMISSION FUNCTION (PROPERLY IMPLEMENTED)
  const handleSubmitPhoto = useCallback(async () => {
    console.log("Button clicked, starting enhanced image submission...");

    // Get fresh photos from the store instead of using stale closure reference
    const photos = usePhotosStore.getState().capturedPhotos;

    console.log(
      "📸 Current photos being submitted:",
      photos.map((p) => p.id)
    );

    setSubmit(true);
    setLoading(true);
    setUploadProgress(0);

    try {
      // Validate photos
      const validation = submissionService.validatePhotos(photos);
      if (!validation.isValid) {
        Alert.alert("Invalid Photos", validation.errors.join("\n"));
        return;
      }

      const endpoints = {
        fruits: "https://leidanielaguila-nutrivision.hf.space/detect",
        labels: "https://dwyght-text-recognition.hf.space/extract/",
        fruits_detailed:
          "https://leidanielaguila-nutrivision.hf.space/detect/detailed",
      };

      const urlToSend = isLabelMode ? endpoints.labels : endpoints.fruits;
      console.log(
        `Submitting ${photos.length} photos to ${
          isLabelMode ? "labels" : "fruits"
        } endpoint`
      );

      const formData = await submissionService.createFormData(photos);
      const headers = {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      };

      const onProgress = (percentCompleted) => {
        if (
          typeof percentCompleted === "number" &&
          percentCompleted >= 0 &&
          percentCompleted <= 100
        ) {
          setUploadProgress(percentCompleted);
          console.log(`📈 Upload progress: ${percentCompleted}%`);
        }
      };

      let response;

      if (isLabelMode || isFruitMode) {
        response = await submissionService.submitWithRetry(
          urlToSend,
          formData,
          headers,
          0,
          onProgress
        );

        console.log("🧾 Raw response:", JSON.stringify(response.data));

        if (isLabelMode) {
          const combined = response.data.combined || {};
          const { carbs_total, protein_total, sodium_total, calories_total } = combined;

          console.log("🔍 LABEL MODE - Extracted values:");
          console.log("  carbs_total:", carbs_total);
          console.log("  protein_total:", protein_total);
          console.log("  sodium_total:", sodium_total);

          const parsedCarbs = parseFloat(carbs_total ?? 0);
          const parsedProtein = parseFloat(protein_total ?? 0);
          const parsedSodium = parseFloat(sodium_total ?? 0) / 1000;

          console.log("🔍 LABEL MODE - Parsed values:");
          console.log("  parsedCarbs:", parsedCarbs);
          console.log("  parsedProtein:", parsedProtein);
          console.log("  parsedSodium:", parsedSodium);

          if (carbs_total !== undefined) {
            console.log("✅ Setting carbs to:", parsedCarbs);
            setCarbs(parsedCarbs);
          }
          if (protein_total !== undefined) {
            console.log("✅ Setting protein to:", parsedProtein);
            setProtein(parsedProtein);
          }
          if (sodium_total !== undefined) {
            console.log("✅ Setting sodium to:", parsedSodium);
            setSodium(parsedSodium);
          }

          console.log(`SERVINGS: ${response.data.items?.servings}`);

          const detailedIntakes = response.data.items.map((intake, index) => {
            const detectedServings = intake.servings_count ||
              parseFloat(intake.final_extracted?.servings ?? 0) ||
              0;

            return {
              type: "label",
              imageUrl: photos[index]?.uri,
              carbs: parseFloat(intake.raw_extracted.carbohydrates ?? 0) || 0,
              protein: parseFloat(intake.raw_extracted.protein ?? 0) || 0,
              sodium: parseFloat(intake.raw_extracted.sodium ?? 0) / 1000 || 0,
              calories: parseFloat(intake.raw_extracted.calories ?? 0) || 0,
              servings: detectedServings,
              originalServings: detectedServings, // 🔥 Store original detected servings
            };
          });

          console.log("📊 Setting detailed intakes:", detailedIntakes);
          useDetailedNutrientStore.getState().setIntake(detailedIntakes);
        } else if (isFruitMode) {
          // FRUIT MODE - This is likely where your issue is
          const fruits = response.data.fruits || {};
          const { total_carbs, total_protein, total_sodium, total_kcal } = fruits;

          console.log("🍎 FRUIT MODE - Raw fruits object:", fruits);
          console.log("🔍 FRUIT MODE - Extracted values:");
          console.log("  total_carbs:", total_carbs);
          console.log("  total_protein:", total_protein);
          console.log("  total_sodium:", total_sodium);

          const parsedCarbs = total_carbs ?? 0;
          const parsedProtein = total_protein ?? 0;
          const parsedSodium = total_sodium ?? 0;
          const parsedKcal = total_kcal ?? 0;

          console.log("🔍 FRUIT MODE - Parsed values:");
          console.log("  parsedCarbs:", parsedCarbs);
          console.log("  parsedProtein:", parsedProtein);
          console.log("  parsedSodium:", parsedSodium);

          if (total_carbs !== undefined) {
            console.log("✅ Setting carbs to:", parsedCarbs);
            setCarbs(parsedCarbs);
          } else {
            console.log("⚠️ total_carbs is undefined");
          }

          if (total_protein !== undefined) {
            console.log("✅ Setting protein to:", parsedProtein);
            setProtein(parsedProtein);
          } else {
            console.log("⚠️ total_protein is undefined");
          }

          if (total_sodium !== undefined) {
            console.log("✅ Setting sodium to:", parsedSodium);
            setSodium(parsedSodium);
          } else {
            console.log("⚠️ total_sodium is undefined");
          }

          // Fetch detailed data for fruit mode
          try {
            console.log("🔍 Fetching detailed detection data...");
            const detailedFormData = await submissionService.createFormData(
              photos
            );
            const detailedResponse = await submissionService.submitWithRetry(
              endpoints.fruits_detailed,
              detailedFormData,
              headers,
              0,
              null
            );

            console.log(
              "📊 Detailed response:",
              JSON.stringify(detailedResponse.data)
            );

            if (
              detailedResponse.data.success &&
              detailedResponse.data.data.length > 0
            ) {
              const detailedIntakes = detailedResponse.data.data.map(
                (intake) => ({
                  type: intake.type,
                  imageUrl: photos[intake.imageIndex],
                  carbs: intake.carbs ?? 0,
                  protein: intake.protein ?? 0,
                  calories: intake.kcal ?? 0,
                  sodium: intake.sodium ?? 0,
                })
              );

              console.log("📊 Setting detailed intakes:", detailedIntakes);
              useDetailedNutrientStore.getState().setIntake(detailedIntakes);
            }
          } catch (detailedError) {
            console.error("❌ Error fetching detailed data:", detailedError);
            showToast("error", "Error!", "Network Error, please try again");
          }
        }
      } else if (isBothMode) {
        console.log(
          "🔄 Submitting to both label and fruit (detailed) endpoints..."
        );

        const [labelResponse, fruitDetailedResponse] = await Promise.all([
          submissionService.submitWithRetry(
            endpoints.labels,
            formData,
            headers,
            0,
            onProgress
          ),
          submissionService.submitWithRetry(
            endpoints.fruits_detailed,
            formData,
            headers,
            0,
            onProgress
          ),
        ]);

        console.log("✅ Label response:", JSON.stringify(labelResponse.data));
        console.log(
          "✅ Fruit detailed response:",
          JSON.stringify(fruitDetailedResponse.data)
        );

        // Extract totals from label response
        const labelCombined = labelResponse.data.combined || {};
        const { carbs_total, protein_total, sodium_total } = labelCombined;

        // Extract fruits data (array of detections)
        const fruitData = fruitDetailedResponse.data.data || [];

        // Compute fruit totals
        const fruitTotals = fruitData.reduce(
          (totals, f) => ({
            carbs: totals.carbs + ((f.carbs ?? 0) || 0),
            protein: totals.protein + ((f.protein ?? 0) || 0),
            sodium: totals.sodium + ((f.sodium ?? 0) || 0),            
          }),
          { carbs: 0, protein: 0, sodium: 0 }
        );

        console.log("🍎 Fruit totals computed:", fruitTotals);

        // Combine both totals
        const totalCarbs = parseFloat(
          (
            (parseFloat(carbs_total ?? 0) || 0) + (fruitTotals.carbs || 0)
          ).toFixed(5)
        );
        const totalProtein = parseFloat(
          (
            (parseFloat(protein_total ?? 0) || 0) + (fruitTotals.protein || 0)
          ).toFixed(5)
        );
        const totalSodium = parseFloat(
          (
            (parseFloat(sodium_total ?? 0) / 1000 || 0) +
            (fruitTotals.sodium || 0)
          ).toFixed(5)
        );

        console.log("🔍 BOTH MODE - Combined totals:");
        console.log("  totalCarbs:", totalCarbs);
        console.log("  totalProtein:", totalProtein);
        console.log("  totalSodium:", totalSodium);

        // Update UI totals
        console.log("✅ Setting combined values...");
        setCarbs(totalCarbs);
        setProtein(totalProtein);
        setSodium(totalSodium);

        // Map detailed entries from both detections
        const labelIntakes = labelResponse.data.items
          .map((intake, index) => ({
            type: "label",
            imageUrl: photos[index]?.uri,
            carbs: parseFloat(intake.raw_extracted.carbohydrates ?? 0) || 0,
            protein: parseFloat(intake.raw_extracted.protein ?? 0) || 0,
            sodium: parseFloat(intake.raw_extracted.sodium ?? 0) / 1000 || 0,
            calories: parseFloat(intake.raw_extracted.kcal ?? 0) || 0,
            servings: parseFloat(intake.raw_extracted.servings ?? 0),
            hasData:
              intake.carbs_total !== null ||
              intake.protein_total !== null ||
              intake.sodium_total !== null || 
              intake.calories !== null,
          }))
          .filter((intake) => intake.hasData)
          .map(({ hasData, ...intake }) => intake);

        const fruitIntakes = fruitData.map((intake) => ({
          type: intake.type,
          imageUrl: photos[intake.imageIndex],
          carbs: intake.carbs ?? 0,
          protein: intake.protein ?? 0,
          sodium: intake.sodium ?? 0,
          calories: intake.kcal ?? 0
        }));

        const detailedIntakes = [...labelIntakes, ...fruitIntakes];
        console.log("📊 Setting detailed intakes:", detailedIntakes);
        useDetailedNutrientStore.getState().setIntake(detailedIntakes);

        response = { data: { labelResponse, fruitDetailedResponse } };
      }

      console.log("🎯 About to navigate to nutrient-page");
      navigation.navigate("nutrient-page");
      return response.data;
    } catch (error) {
      console.error("❌ Error in handleSubmitPhoto:", error);
      Alert.alert("Check internet connection", "Please try submitting again.");      
    } finally {
      setLoading(false);
      setSubmit(false);
      setUploadProgress(0);
    }
  }, [
    isLabelMode,
    isFruitMode,
    isBothMode,
    navigation,
    setCarbs,
    setProtein,
    setSodium,
  ]);

  // Rest of your existing functions remain the same...
  const loadExistingPhotos = async () => {
    try {
      if (Platform.OS === "ios") {
        // iOS: Load from MediaLibrary and sync with store
        const album = await MediaLibrary.getAlbumAsync("NutriVision");
        if (!album) {
          console.log("NutriVision album not found");
          return;
        }

        const { assets } = await MediaLibrary.getAssetsAsync({
          album: album.id,
          mediaType: ["photo"],
          first: 5,
          sortBy: ["creationTime"],
          reverse: true,
        });

        const photos = await Promise.all(
          assets.map(async (asset) => {
            try {
              const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
              const uri = `file://${
                assetInfo.localUri?.replace("ph://", "") ||
                assetInfo.uri.replace("ph://", "")
              }`;

              return {
                uri,
                type: "label",
                id: asset.id,
              };
            } catch (error) {
              console.error("Error processing asset:", error);
              return null;
            }
          })
        );

        const validPhotos = photos.filter((photo) => photo !== null);

        // Update store with MediaLibrary photos
        setPhotos(validPhotos);
      } else {
        // Android: Photos are already in store, no need to load from anywhere else
        // Store is the single source of truth on Android
        console.log("Android: Using photos from store");
      }
    } catch (error) {
      console.error("Error loading existing photos:", error);
    }
  };

  useEffect(() => {
    (async () => {
      if (Platform.OS === "ios") {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setMediaLibraryPermission(status === "granted");

        if (status === "granted") {
          await loadExistingPhotos();
        }
      } else {
        // Android: Don't request Media Library permissions, just use store
        setMediaLibraryPermission(false);
        console.log("Android: Skipping Media Library permissions");
      }
    })();
  }, []);

  useEffect(() => {
    if (Platform.OS === "ios" && mediaLibraryPermission) {
      loadExistingPhotos();
    }
  }, [mediaLibraryPermission]);

  if (!permission) {
    return <View />;
  }
  if (!permission.granted && Platform.OS === "ios") {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{ textAlign: "center", marginBottom: 10 }}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  function handleGoBack() {
    navigation.goBack();
  }

  const handleSegmentChange = (index, key) => {
    setSelectedSegmentIndex(index);
    console.log(`Selected: ${key} (index: ${index})`);
  };

  const handleTakePhoto = async () => {
    // Check if user already has 5 photos
    if (capturedPhotos.length >= 5) {
      Alert.alert(
        "Photo Limit Reached",
        "You can only capture a maximum of 5 photos. Please delete some photos before taking new ones.",
        [
          {
            text: "OK",
            style: "default",
          },
        ]
      );
      return; // Exit early if limit reached
    }

    if (cameraRef.current) {
      const options = { quality: 1, base64: true, exif: false };
      const takenPhoto = await cameraRef.current.takePictureAsync(options);

      if (isLabelMode) {
        const boxWidthPercent = 0.7;
        const boxHeightPercent = 0.6;

        if (
          Platform.OS === "android" &&
          previewLayout.width &&
          previewLayout.height
        ) {
          const previewAspect = previewLayout.width / previewLayout.height;
          const photoAspect = takenPhoto.width / takenPhoto.height;

          let scale,
            offsetX = 0,
            offsetY = 0,
            visiblePreviewWidth,
            visiblePreviewHeight;

          if (photoAspect > previewAspect) {
            scale = takenPhoto.height / previewLayout.height;
            visiblePreviewWidth = previewLayout.width;
            visiblePreviewHeight = previewLayout.height;
            offsetX = Math.round(
              (takenPhoto.width - previewLayout.width * scale) / 2
            );
          } else {
            scale = takenPhoto.width / previewLayout.width;
            visiblePreviewWidth = previewLayout.width;
            visiblePreviewHeight = previewLayout.height;
            offsetY = Math.round(
              (takenPhoto.height - previewLayout.height * scale) / 2
            );
          }

          const guideBoxWidth = visiblePreviewWidth * boxWidthPercent;
          const guideBoxHeight = visiblePreviewHeight * boxHeightPercent;
          const guideBoxX = (visiblePreviewWidth - guideBoxWidth) / 2;
          const guideBoxY = (visiblePreviewHeight - guideBoxHeight) / 2;

          const cropWidth = Math.round(guideBoxWidth * scale);
          const cropHeight = Math.round(guideBoxHeight * scale);
          const originX = Math.round(guideBoxX * scale + offsetX);
          const originY = Math.round(guideBoxY * scale + offsetY);

          const croppedPhoto = await ImageManipulator.manipulateAsync(
            takenPhoto.uri,
            [
              {
                crop: {
                  originX,
                  originY,
                  width: cropWidth,
                  height: cropHeight,
                },
              },
            ],
            { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
          );

          croppedPhoto.orientation = "vertical";
          croppedPhoto.type = "label";
          setPhoto(croppedPhoto);
        } else {
          const cropWidth = takenPhoto.width * boxWidthPercent;
          const cropHeight = takenPhoto.height * boxHeightPercent;
          const originX = (takenPhoto.width - cropWidth) / 2;
          const originY = (takenPhoto.height - cropHeight) / 2;

          const croppedPhoto = await ImageManipulator.manipulateAsync(
            takenPhoto.uri,
            [
              {
                crop: {
                  originX,
                  originY,
                  width: cropWidth,
                  height: cropHeight,
                },
              },
            ],
            { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
          );

          croppedPhoto.orientation = "vertical";
          croppedPhoto.type = "label";
          setPhoto(croppedPhoto);
        }
      } else {
        takenPhoto.type = "fruit";
        setPhoto(takenPhoto);
      }
    }
  };

  // Simple fallback for Android - just keep photos in memory/state
  const handleSavePhoto = async (processedUri) => {
    if (!photo) return;

    if (Platform.OS === "ios") {
      // iOS: Use MediaLibrary AND update store
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync(false);
        if (status !== "granted") {
          Alert.alert(
            "Permission required",
            "We need permission to access your photo library to save photos."
          );
          return;
        }

        const uriToSave = processedUri || photo.uri;
        const asset = await MediaLibrary.createAssetAsync(uriToSave);

        let localUri = asset.uri;
        const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
        localUri = assetInfo.localUri || assetInfo.uri;

        let album = await MediaLibrary.getAlbumAsync("NutriVision");
        if (!album) {
          album = await MediaLibrary.createAlbumAsync(
            "NutriVision",
            asset,
            false
          );
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }

        const photoWithId = {
          uri: `file://${localUri.replace("ph://", "")}`,
          id: asset.id,
          type: photo.type || "label",
          width: photo.width,
          height: photo.height,
          orientation: photo.orientation,
        };

        // Add to store for consistency across app
        addPhoto(photoWithId);

        // Also load existing photos from MediaLibrary
        await loadExistingPhotos();

        Alert.alert("Success", "Photo saved to your gallery in NutriVision!");
        setPhoto(null);
      } catch (error) {
        console.error("Error saving photo on iOS:", error);
        Alert.alert("Check internet connection", "Failed to save photo to gallery.");
      }
    } else {
      // Android: Only use Zustand store (no MediaLibrary)
      try {
        const photoWithId = {
          uri: processedUri || photo.uri,
          id: `photo_${Date.now()}`,
          type: photo.type || "label",
          width: photo.width,
          height: photo.height,
          orientation: photo.orientation,
        };

        // Add to store
        addPhoto(photoWithId);

        Alert.alert("Success", "Photo added to your session!");
        setPhoto(null);
      } catch (error) {
        console.error("Error saving photo on Android:", error);
        Alert.alert("Check internet connection", "Failed to add photo.");
      }
    }
  };
  const handleDeletePhoto = async (photoToDelete, index) => {
    try {
      console.log("Attempting to delete photo:", {
        id: photoToDelete.id,
        uri: photoToDelete.uri,
        index,
      });

      if (Platform.OS === "ios") {
        // iOS: Delete from MediaLibrary AND store
        const { status } = await MediaLibrary.requestPermissionsAsync(false);
        if (status !== "granted") {
          Alert.alert(
            "Permission required",
            "We need permission to delete photos from your gallery."
          );
          return;
        }

        const album = await MediaLibrary.getAlbumAsync("NutriVision");
        if (!album) {
          console.log("NutriVision album not found");
          // Still remove from store
          removePhoto(index);
          return;
        }

        const { assets } = await MediaLibrary.getAssetsAsync({
          album: album.id,
          mediaType: ["photo"],
        });

        let assetToDelete;
        if (photoToDelete.id) {
          assetToDelete = assets.find((asset) => asset.id === photoToDelete.id);
        }

        if (assetToDelete) {
          const success = await MediaLibrary.deleteAssetsAsync([
            assetToDelete.id,
          ]);
          if (success) {
            // Remove from store
            removePhoto(index);
            console.log(
              "Photo deleted successfully from iOS gallery and store"
            );
            await loadExistingPhotos(); // Refresh from MediaLibrary
          } else {
            throw new Error("Failed to delete asset from iOS gallery");
          }
        } else {
          console.log("Asset not found in album, removing from store only");
          removePhoto(index);
        }
      } else {
        // Android: Only remove from store
        removePhoto(index);
        console.log("Photo removed from Android store");
      }
    } catch (error) {
      console.error("Delete photo error:", error);
      Alert.alert("Check Internet Connectivity...", "Failed to delete photo. Please try again.");
    }
  };
  if (photo) {
    return (
      <View style={styles.container}>
        <PhotoPreviewSection
          photo={photo}
          onBack={() => setPhoto(null)}
          onSubmit={() => handleSavePhoto()}
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Loading />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <SafeAreaView>
          <View>
            <CustomModal
              title="Proper adjustment for detection"
              visible={isVisible}
              onClose={() => setIsVisible(false)}
            >
              <Toast
                type={toast.type}
                title={toast.title}
                message={toast.message}
                visible={toast.visible}
              />
              <Text>For best results of detection:</Text>
              <Image
                source={require("@/assets/images/take-picture.png")}
                width={80}
                style={{ margin: "auto" }}
              />
              <Text style={{ fontWeight: "bold", marginTop: 8 }}>
                1. Nutritional Label
              </Text>
              <Text style={{ marginLeft: 12, marginTop: 8 }}>
                make sure that the label is within the green rectangle in the
                camera.
              </Text>
              <Text style={{ fontWeight: "bold", marginTop: 8 }}>
                2. Fruit detection
              </Text>
              <Text style={{ marginLeft: 12, marginTop: 8 }}>
                give at least 0.25 meters or from the end of the middle
                fingertip to just below the wrist.
              </Text>
            </CustomModal>
          </View>
          <View style={styles.thumbnailsRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 8,
              }}
            >
              {capturedPhotos.map((item, index) => (
                <View key={index} style={styles.thumbnailContainer}>
                  <Image
                    source={{
                      uri:
                        Platform.OS === "ios"
                          ? `file://${item.uri
                              .replace("ph://", "")
                              .replace("file://", "")}`
                          : item.uri,
                    }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                    onError={(e) =>
                      console.log("Image loading error:", e.nativeEvent.error)
                    }
                  />
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      console.log("Delete button pressed for index:", index);
                      handleDeletePhoto(item, index);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <AntDesign name="close" size={16} color="white" />
                  </TouchableOpacity>
                  <View
                    style={[
                      styles.thumbnailIndicator,
                      item.type === "label"
                        ? styles.labelIndicator
                        : styles.fruitIndicator,
                    ]}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.mainSection}>
        <View style={styles.segmentedControlWrapper}>
          <SegmentedControl
            selectedIndex={selectedSegmentIndex}
            onSelectionChange={handleSegmentChange}
            activeColor="#4CAF50"
            inactiveColor="#999"
            backgroundColor="rgba(0,0,0,0.7)"
            textActiveColor="white"
            textInactiveColor="#ccc"
            containerStyle={styles.segmentedControlContainer}
          />
        </View>

        <CameraView
          style={styles.camera}
          facing={facing}
          ref={cameraRef}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setPreviewLayout({ width, height });
          }}
        >
          <View style={styles.overlay}>
            {isLabelMode && (
              <View style={[styles.guideBox, styles.labelGuideBox]} />
            )}
          </View>

          <View style={styles.bottomControlsContainer}>
            <View style={styles.bottomControls}>
              <TouchableOpacity
                style={styles.returnButton}
                onPress={handleGoBack}
                disabled={false}
              >
                <Ionicons
                  name="return-down-back-outline"
                  size={28}
                  color="white"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleTakePhoto}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.returnButton, { opacity: submit ? 0.5 : 1 }]}
                onPress={() => handleSubmitPhoto()}
                disabled={submit || capturedPhotos.length === 0}
              >
                <Ionicons
                  name="return-down-forward-outline"
                  size={28}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    </View>
  );
}

// Styles remain the same, with addition of progress styles
const segmentedStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 25,
    padding: 4,
    position: "relative",
    alignSelf: "center",
    minWidth: SEGMENTED_WIDTH,
    width: SEGMENTED_WIDTH,
  },
  highlight: {
    position: "absolute",
    top: 4,
    left: 4,
    height: 40,
    borderRadius: 20,
    zIndex: 1,
  },
  optionsContainer: {
    flexDirection: "row",
    zIndex: 2,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: SEGMENT_WIDTH - 8,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 18,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1000,
  },
  progressText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 10,
    borderRadius: 8,
  },
  thumbnailsRow: {
    height: 80,
    backgroundColor: "#252525ff",
    paddingVertical: 10,
    paddingHorizontal: 5,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#252525ff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginHorizontal: 5,
    position: "relative",
    overflow: "visible",
    elevation: 3,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  deleteButton: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    elevation: 4,
  },
  thumbnailIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  labelIndicator: {
    backgroundColor: "#f5dd4b",
  },
  fruitIndicator: {
    backgroundColor: "#81b0ff",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  guideBox: {
    width: "80%",
    height: "30%",
    borderWidth: 3,
    backgroundColor: "transparent",
  },
  labelGuideBox: {
    borderColor: "lightgreen",
    width: "70%",
    height: "60%",
  },
  segmentedControlWrapper: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: "center",
  },
  segmentedControlContainer: {
    marginHorizontal: 21,
  },
  returnButton: {
    backgroundColor: "transparent",
    borderRadius: 0,
    width: undefined,
    height: undefined,
    margin: 10,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "black",
  },
  bottomControlsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#252525ff",
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  topSection: {
    backgroundColor: "#252525ff",
    zIndex: 10,
  },
  mainSection: {
    flex: 1,
    position: "relative",
  },
});
