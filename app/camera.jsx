import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
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
  SafeAreaView,
  Dimensions,
  Linking,
} from "react-native";
// import Animated, {
//   useAnimatedStyle,
//   withSpring,
//   interpolateColor,
// } from 'react-native-reanimated';
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
import { Audio } from 'expo-av';

const { height, width: screenWidth } = Dimensions.get("window");

// SegmentedControl Component (Integrated)
const SEGMENTED_WIDTH = screenWidth * 0.7;
const SEGMENT_WIDTH = SEGMENTED_WIDTH / 2;

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
      errors
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
      console.warn('Image optimization failed, using original:', error);
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
      const fileType = uriParts[uriParts.length - 1] || 'jpg';
      
      const fileObject = {
        uri: photo.uri,
        name: `photo_${i}.${fileType}`,
        type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
      };

      formData.append("files", fileObject);
    }

    return formData;
  }

  async submitWithRetry(url, formData, headers, retryCount = 0, onProgress = null) {
    try {
      console.log(`🚀 Making request attempt ${retryCount + 1} with progress tracking:`, !!onProgress);
      
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
            console.warn("⚠️ No progress callback or invalid total:", { hasCallback: !!onProgress, total: progressEvent?.total });
          }
        },
      });

      return response;
    } catch (error) {
      if (retryCount < this.maxRetries && this.shouldRetry(error)) {
        console.log(`Retry attempt ${retryCount + 1}/${this.maxRetries}`);
        await this.delay(1000 * (retryCount + 1));
        return this.submitWithRetry(url, formData, headers, retryCount + 1, onProgress);
      }
      throw error;
    }
  }

  shouldRetry(error) {
    if (error.code === 'ECONNABORTED') return true;
    if (error.response?.status >= 500) return true;
    if (error.response?.status === 429) return true;
    return false;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getErrorMessage(error) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please check your connection and try again.';
    }
    
    if (error.response) {
      switch (error.response.status) {
        case 400:
          return 'Invalid image format. Please try different photos.';
        case 413:
          return 'Images too large. Please use smaller photos.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return `Server error (${error.response.status}). Please try again.`;
      }
    }
    
    if (error.request) {
      return 'Network error. Please check your connection.';
    }
    
    return 'An unexpected error occurred. Please try again.';
  }
}

// Create a singleton instance
const submissionService = new PhotoSubmissionService();

const SegmentedControl = ({
  selectedIndex = 0,
  onSelectionChange,
  containerStyle,
  activeColor = '#4CAF50',
  inactiveColor = '#999',
  backgroundColor = 'rgba(0,0,0,0.6)',
  textActiveColor = 'white',
  textInactiveColor = '#4e4242ff',
}) => {
  const options = [
    {
      key: 'labels',
      label: 'Labels',
      icon: 'document-text-outline',
    },
    {
      key: 'fruits',
      label: 'Fruits',
      icon: 'leaf-outline',
    },
  ];

  const handlePress = (index) => {
    if (onSelectionChange) {
      onSelectionChange(index, options[index].key);
    }
  };

  return (
    <View style={[segmentedStyles.container, { backgroundColor }, containerStyle]}>
      <View style={[segmentedStyles.highlight, { 
        backgroundColor: activeColor,
        transform: [{ translateX: selectedIndex * SEGMENT_WIDTH }],
        width: SEGMENT_WIDTH - 8 
      }]} />
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
                color={selectedIndex === index ? textActiveColor : textInactiveColor}
              />
              <Text style={[segmentedStyles.optionText, {
                color: selectedIndex === index ? textActiveColor : textInactiveColor
              }]}>
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
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submit, setSubmit] = useState(false);
  const [previewLayout, setPreviewLayout] = useState({ width: 0, height: 0 });
  const [uploadProgress, setUploadProgress] = useState(0);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthenticated) {
      navigation.replace('login');
    }
  }, [isAuthenticated, navigation]);

  const isLabelMode = selectedSegmentIndex === 0;
  
  const setCarbs = useNutrientsStore((state) => state.setCarbs);
  const setProtein = useNutrientsStore((state) => state.setProtein);
  const setSodium = useNutrientsStore((state) => state.setSodium);

  const facing = "back";
  const cameraRef = useRef(null);

  useEffect(() => {
  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Microphone permission not granted');
        }
      } catch (error) {
        console.log('Error requesting microphone permission:', error);
      }
    }
  };

  requestMicrophonePermission();
}, []);

  // Function to delete all captured photos after successful submission
  const deleteAllCapturedPhotos = useCallback(async (photos) => {
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

      const album = await MediaLibrary.getAlbumAsync("NutriVision");
      if (!album) {
        console.log("NutriVision album not found, clearing state only");
        setCapturedPhotos([]);
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
          const asset = assets.find(a => a.id === photo.id);
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

        const asset = assets.find(a => {
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
        console.log(`Deleting ${photosToDelete.length} photos from device storage`);
        const deleteSuccess = await MediaLibrary.deleteAssetsAsync(photosToDelete);
        
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

  // ENHANCED SUBMISSION FUNCTION (PROPERLY IMPLEMENTED)
  const handleSubmitPhoto = useCallback(async (photos) => {
    console.log("Button clicked, starting enhanced image submission...");
    
    // Update UI state
    setSubmit(true);
    setLoading(true);
    setUploadProgress(0);
    
    try {
      // Validate photos
      const validation = submissionService.validatePhotos(photos);
      if (!validation.isValid) {
        Alert.alert('Invalid Photos', validation.errors.join('\n'));
        return;
      }

      // Set up endpoints
      const endpoints = {
        fruits: "https://leidanielaguila-nutrivision.hf.space/detect",
        labels: "https://dwyght-text-recognition.hf.space/extract/"
      };
      
      const urlToSend = isLabelMode ? endpoints.labels : endpoints.fruits;

      console.log(`Submitting ${photos.length} photos to ${isLabelMode ? 'labels' : 'fruits'} endpoint`);

      // Create FormData
      const formData = await submissionService.createFormData(photos);

      // Enhanced headers
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      };

      // Progress callback with enhanced safety checks
      const onProgress = (percentCompleted) => {
        console.log("📊 Progress callback called with:", percentCompleted); // Debug log
        
        // Validate the percentage
        if (typeof percentCompleted === 'number' && percentCompleted >= 0 && percentCompleted <= 100) {
          setUploadProgress(percentCompleted);
          console.log(`📈 UI Updated - Upload progress: ${percentCompleted}%`);
        } else {
          console.warn("⚠️ Invalid progress percentage:", percentCompleted);
        }
      };

      // Submit with retry logic
      const response = await submissionService.submitWithRetry(
        urlToSend, 
        formData, 
        headers,
        0,
        onProgress
      );

      console.log("✅ Response from server:", response.data);

      // Process response based on mode with safety checks
      if (isLabelMode) {
        const combined = response.data.combined || {};
        const { carbs_total, protein_total, sodium_total } = combined;
        
        if (carbs_total !== undefined) setCarbs(parseFloat(carbs_total));
        if (protein_total !== undefined) setProtein(parseFloat(protein_total));
        if (sodium_total !== undefined) setSodium(parseFloat(sodium_total) / 1000);
      } else {
        const fruits = response.data.fruits || {};
        const { total_carbs, total_protein, total_sodium } = fruits;
        
        if (total_carbs !== undefined) setCarbs(total_carbs);
        if (total_protein !== undefined) setProtein(total_protein);
        if (total_sodium !== undefined) setSodium(total_sodium);
      }

      // 🗑️ SUCCESS: Delete all captured photos after successful submission
      // await deleteAllCapturedPhotos(photos);

      // Navigate to results
      navigation.navigate("nutrient-page");
      return response.data;

    } catch (error) {
      console.error("❌ Enhanced photo submission error:", error);
      
      const errorMessage = submissionService.getErrorMessage(error);
      Alert.alert("Submission Failed", errorMessage);
      
      // Log detailed error for debugging
      if (error.response) {
        console.error("Error details:", error.response.data);
        console.error("Status code:", error.response.status);
      }
      
      // 🗑️ TEMPORARY: Delete photos even on failure (for testing purposes)
      console.log("⚠️ TEMPORARY MODE: Deleting photos even though submission failed");
      await deleteAllCapturedPhotos(photos);
      
      throw error;
    } finally {
      // Always clean up UI state
      setLoading(false);
      setSubmit(false);
      setUploadProgress(0);
    }
  }, [isLabelMode, navigation, setCarbs, setProtein, setSodium, deleteAllCapturedPhotos]);

  // Rest of your existing functions remain the same...
  const loadExistingPhotos = async () => {
    try {
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
            const uri =
              Platform.OS === "ios"
                ? `file://${
                    assetInfo.localUri?.replace("ph://", "") ||
                    assetInfo.uri.replace("ph://", "")
                  }`
                : asset.uri;

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
      setCapturedPhotos(validPhotos);
    } catch (error) {
      console.error("Error loading existing photos:", error);
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setMediaLibraryPermission(status === "granted");

      if (status === "granted") {
        await loadExistingPhotos();
      }
    })();
  }, []);

  useEffect(() => {
    if (mediaLibraryPermission) {
      loadExistingPhotos();
    }
  }, [mediaLibraryPermission]);

  if (!permission) {
    return <View />;
  }
  if (!permission.granted) {
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
            style: "default"
          }
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

        if (Platform.OS === "android" && previewLayout.width && previewLayout.height) {
          const previewAspect = previewLayout.width / previewLayout.height;
          const photoAspect = takenPhoto.width / takenPhoto.height;

          let scale, offsetX = 0, offsetY = 0, visiblePreviewWidth, visiblePreviewHeight;

          if (photoAspect > previewAspect) {
            scale = takenPhoto.height / previewLayout.height;
            visiblePreviewWidth = previewLayout.width;
            visiblePreviewHeight = previewLayout.height;
            offsetX = Math.round((takenPhoto.width - previewLayout.width * scale) / 2);
          } else {
            scale = takenPhoto.width / previewLayout.width;
            visiblePreviewWidth = previewLayout.width;
            visiblePreviewHeight = previewLayout.height;
            offsetY = Math.round((takenPhoto.height - previewLayout.height * scale) / 2);
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

  const handleSavePhoto = async (processedUri) => {
    if (!photo) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
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
      if (Platform.OS === "ios") {
        const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
        localUri = assetInfo.localUri || assetInfo.uri;
      }

      let album = await MediaLibrary.getAlbumAsync("NutriVision");
      if (!album) {
        album = await MediaLibrary.createAlbumAsync("NutriVision", asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      const photoWithId = {
        ...photo,
        uri:
          Platform.OS === "ios"
            ? `file://${localUri.replace("ph://", "")}`
            : localUri,
        id: asset.id,
        type: photo.type || "label",
      };

      setCapturedPhotos((prev) => {
        const newPhotos = [photoWithId, ...prev].slice(0, 5);
        console.log("Updated photos:", newPhotos);
        return newPhotos;
      });

      await loadExistingPhotos();

      Alert.alert("Success", "Photo saved to your gallery in NutriVision!");
      setPhoto(null);
    } catch (error) {
      console.error("Error saving photo:", error);
      Alert.alert("Error", "Failed to save photo to gallery.");
    }
  };

  const handleDeletePhoto = async (photoToDelete, index) => {
    try {
      console.log("Attempting to delete photo:", {
        id: photoToDelete.id,
        uri: photoToDelete.uri,
        index,
      });

      const { status } = await MediaLibrary.requestPermissionsAsync();
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
        return;
      }

      const { assets } = await MediaLibrary.getAssetsAsync({
        album: album.id,
        mediaType: ["photo"],
      });

      console.log("Found assets in album:", assets.length);

      const cleanUri = (uri) => {
        if (!uri) return "";
        return uri
          .replace("ph://", "")
          .replace("file://", "")
          .split("?")[0]
          .split("#")[0];
      };

      let assetToDelete;

      if (photoToDelete.id) {
        assetToDelete = assets.find((asset) => asset.id === photoToDelete.id);
      }

      if (!assetToDelete) {
        const targetUri = cleanUri(photoToDelete.uri);
        console.log("Looking for URI match:", targetUri);

        assetToDelete = assets.find((asset) => {
          const assetUri = cleanUri(asset.uri);
          const matches = assetUri === targetUri;
          if (matches) {
            console.log("Found matching asset:", asset.id);
          }
          return matches;
        });
      }

      if (assetToDelete) {
        const success = await MediaLibrary.deleteAssetsAsync([assetToDelete.id]);
        if (success) {
          setCapturedPhotos((prev) => prev.filter((_, i) => i !== index));
          console.log("Photo deleted successfully");
          await loadExistingPhotos();
        } else {
          throw new Error("Failed to delete asset");
        }
      } else {
        console.log("Asset not found in album");
        setCapturedPhotos((prev) => prev.filter((_, i) => i !== index));
      }
    } catch (error) {
      console.error("Delete photo error:", error);
      Alert.alert("Error", "Failed to delete photo. Please try again.");
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
        {uploadProgress > 0 && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Uploading: {uploadProgress}%
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <SafeAreaView>
          <View style={styles.thumbnailsRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'center',
                alignItems: 'center',
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
          onLayout={e => {
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
                <Ionicons name="return-down-back-outline" size={28} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleTakePhoto}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.returnButton, { opacity: submit ? 0.5 : 1 }]}
                onPress={() => handleSubmitPhoto(capturedPhotos)}
                disabled={submit || capturedPhotos.length === 0}
              >
                <Ionicons name="return-down-forward-outline" size={28} color="white" />
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
    flexDirection: 'row',
    borderRadius: 25,
    padding: 4,
    position: 'relative',
    alignSelf: 'center',
    minWidth: SEGMENTED_WIDTH,
    width: SEGMENTED_WIDTH,
  },
  highlight: {
    position: 'absolute',
    top: 4,
    left: 4,
    height: 40,
    borderRadius: 20,
    zIndex: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    zIndex: 2,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: SEGMENT_WIDTH - 8,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
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
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  progressText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    borderColor: 'transparent',
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
    marginHorizontal: 20,
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