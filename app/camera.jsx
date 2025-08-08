import React, {
  useRef,
  useState,
  useEffect,
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
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as ImageManipulator from "expo-image-manipulator";
import { useNavigation } from "@react-navigation/native";
import { useNutrientsStore } from "@/hooks/store";
import axios from "axios";
import PhotoPreviewSection from "@/components/PhotoPreviewSection";
import { useRoute } from "@react-navigation/native";
import Loading from "./loading";

const { height, width: screenWidth } = Dimensions.get("window");

// SegmentedControl Component (Integrated)
const SEGMENTED_WIDTH = screenWidth * 0.7;
const SEGMENT_WIDTH = SEGMENTED_WIDTH / 2;

const SegmentedControl = ({
  selectedIndex = 0,
  onSelectionChange,
  containerStyle,
  activeColor = '#4CAF50',
  inactiveColor = '#999',
  backgroundColor = 'rgba(0,0,0,0.6)',
  textActiveColor = 'white',
  textInactiveColor = '#999',
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

  // Animated style for the sliding highlight
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(selectedIndex * SEGMENT_WIDTH, {
            damping: 15,
            stiffness: 150,
          }),
        },
      ],
      backgroundColor: withSpring(activeColor),
      width: SEGMENT_WIDTH - 8, // match highlight width to segment
    };
  });

  // Animated styles for text and icons
  const getItemAnimatedStyle = (index) => {
    return useAnimatedStyle(() => {
      const isSelected = selectedIndex === index;
      return {
        opacity: withSpring(isSelected ? 1 : 0.7),
      };
    });
  };

  const getTextAnimatedStyle = (index) => {
    return useAnimatedStyle(() => {
      const isSelected = selectedIndex === index;
      return {
        color: interpolateColor(
          isSelected ? 1 : 0,
          [0, 1],
          [textInactiveColor, textActiveColor]
        ),
      };
    });
  };

  const handlePress = (index) => {
    if (onSelectionChange) {
      onSelectionChange(index, options[index].key);
    }
  };

  return (
    <View style={[segmentedStyles.container, { backgroundColor }, containerStyle]}>
      {/* Sliding highlight background */}
      <Animated.View style={[segmentedStyles.highlight, animatedStyle]} />
      {/* Options */}
      <View style={segmentedStyles.optionsContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={option.key}
            style={segmentedStyles.option}
            onPress={() => handlePress(index)}
            activeOpacity={0.8}
          >
            <Animated.View style={[segmentedStyles.optionContent, getItemAnimatedStyle(index)]}>
              <Ionicons
                name={option.icon}
                size={18}
                color={selectedIndex === index ? textActiveColor : textInactiveColor}
              />
              <Animated.Text style={[segmentedStyles.optionText, getTextAnimatedStyle(index)]}>
                {option.label}
              </Animated.Text>
            </Animated.View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Upload function
export async function uploadImagesAxios(images) {
  try {
    const formData = new FormData();

    images.forEach((image) => {
      const uriParts = image.uri.split("/");
      const fileName = image.name || uriParts[uriParts.length - 1];
      const match = /\.(\w+)$/.exec(fileName);
      const type = image.type || (match ? `image/${match[1]}` : "image/jpeg");

      formData.append(
        "files",
        {
          uri: image.uri,
          name: fileName,
          type: type,
        },
        "true"
      );
    });

    const response = await axios.post(
      "https://nutrivision-backend-textrecog-77tx.onrender.com/extract/",
      formData,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log("sent images");
    return response.data;
  } catch (err) {
    console.error("Axios upload error:", err);
    throw err;
  }
}

// Main Camera Component
export default function Camera() {
  const route = useRoute();
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(0); // 0 for labels, 1 for fruits
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submit, setSubmit] = useState(false);
  const [previewLayout, setPreviewLayout] = useState({ width: 0, height: 0 });

  // Computed property based on selected segment
  const isLabelMode = selectedSegmentIndex === 0;
  
  const setCarbs = useNutrientsStore((state) => state.setCarbs);
  const setProtein = useNutrientsStore((state) => state.setProtein);
  const setSodium = useNutrientsStore((state) => state.setSodium);

  const { nutritionData } = route.params || {};
  console.log("Nutrition data from route params:", nutritionData);

  const handleSubmitPhoto = async (photos) => {
    console.log("Button clicked, starting image submission...");
    setSubmit(true);
    setTimeout(() => setSubmit(false), 5000);
    setLoading(true);
    
    const fruitsUrl = "https://leidanielaguila-nutrivision.hf.space/detect";
    const labelsUrl = "https://dwyght-text-recognition.hf.space/extract/";

    if (!photos || photos.length === 0) {
      console.log("No photos provided for submission.");
      setLoading(false);
      return;
    }

    const formData = new FormData();

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const uriParts = photo.uri.split(".");
      const fileType = uriParts[uriParts.length - 1];

      formData.append("files", {
        uri: photo.uri,
        name: `photo_${i}.${fileType}`,
        type: `image/${fileType}`,
      });
    }

    console.log("FormData constructed with", photos.length, "files.");
    const urlToSend = isLabelMode ? labelsUrl : fruitsUrl;

    try {
      console.log("Sending request to backend endpoint...");
      const response = await axios.post(urlToSend, formData, {
        headers: {
          Accept: "application/json",
        },
      });
      console.log("✅ Response from server:", response.data);

      if (isLabelMode) {
        const { carbs_total, protein_total, sodium_total } = response.data.combined;
        setCarbs(parseFloat(carbs_total));
        setProtein(parseFloat(protein_total));
        setSodium(parseFloat(sodium_total) / 1000);
      } else {
        const { total_carbs, total_protein, total_sodium } = response.data.fruits;
        setCarbs(total_carbs);
        setProtein(total_protein);
        setSodium(total_sodium);
      }

      setLoading(false);
      navigation.navigate("nutrient-page");
      return response.data;
    } catch (err) {
      console.error("❌ Axios upload error:", err);
      if (err.response) {
        console.error("Error details:", err.response.data);
        console.error("Status code:", err.response.status);
      }
      setLoading(false);
      Alert.alert("Error", "Failed to process images. Please try again.");
      throw err;
    }
  };

  const navigation = useNavigation();
  const facing = "back";
  const cameraRef = useRef(null);

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
    if (cameraRef.current) {
      const options = { quality: 1, base64: true, exif: false };
      const takenPhoto = await cameraRef.current.takePictureAsync(options);

      if (isLabelMode) {
        // Guide box percentages (from your styles)
        const boxWidthPercent = 0.7;
        const boxHeightPercent = 0.6;

        // Only apply this fix for Android
        if (Platform.OS === "android" && previewLayout.width && previewLayout.height) {
          // 1. Calculate the aspect ratios
          const previewAspect = previewLayout.width / previewLayout.height;
          const photoAspect = takenPhoto.width / takenPhoto.height;

          // 2. Find out if the preview is "letterboxed" (has black bars on sides or top/bottom)
          let scale, offsetX = 0, offsetY = 0, visiblePreviewWidth, visiblePreviewHeight;

          if (photoAspect > previewAspect) {
            // Photo is wider than preview: black bars top/bottom
            scale = takenPhoto.height / previewLayout.height;
            visiblePreviewWidth = previewLayout.width;
            visiblePreviewHeight = previewLayout.height;
            offsetX = Math.round((takenPhoto.width - previewLayout.width * scale) / 2);
          } else {
            // Photo is taller than preview: black bars left/right
            scale = takenPhoto.width / previewLayout.width;
            visiblePreviewWidth = previewLayout.width;
            visiblePreviewHeight = previewLayout.height;
            offsetY = Math.round((takenPhoto.height - previewLayout.height * scale) / 2);
          }

          // 3. Calculate guide box position and size in preview coordinates
          const guideBoxWidth = visiblePreviewWidth * boxWidthPercent;
          const guideBoxHeight = visiblePreviewHeight * boxHeightPercent;
          const guideBoxX = (visiblePreviewWidth - guideBoxWidth) / 2;
          const guideBoxY = (visiblePreviewHeight - guideBoxHeight) / 2;

          // 4. Map guide box to photo coordinates
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
          // iOS or fallback: use the old logic
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top section for thumbnails */}
      <View style={styles.topSection}>
        <SafeAreaView>
          <View style={styles.thumbnailsRow}>
            <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    // Make the content container fill the ScrollView width so justifyContent works
    contentContainerStyle={{
      flexGrow: 1,
      justifyContent: 'center', // use 'center' to simply center them, or 'space-evenly' for even spacing
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

      {/* Main camera section */}
      <View style={styles.mainSection}>
        {/* Segmented Control for Mode Selection */}
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

        {/* Camera View */}
        <CameraView style={styles.camera} facing={facing} ref={cameraRef} onLayout={e => {
  const { width, height } = e.nativeEvent.layout;
  setPreviewLayout({ width, height });
}}>
          {/* Overlay + guide box (only in label mode) */}
          <View style={styles.overlay}>
            {isLabelMode && (
              <View style={[styles.guideBox, styles.labelGuideBox]} />
            )}
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControlsContainer}>
            <View style={styles.bottomControls}>
              {/* LEFT: Go Back */}
              <TouchableOpacity
                style={styles.returnButton}
                onPress={handleGoBack}
                disabled={false}
              >
                <Ionicons name="return-down-back-outline" size={28} color="white" />
              </TouchableOpacity>

              {/* CENTER: Capture */}
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleTakePhoto}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              {/* RIGHT: Submit Photo */}
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

// Segmented Control Styles
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
    // width is set by animatedStyle
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

// Main Component Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailsRow: {
    height: 80,
    backgroundColor: "#252525ff", // Set to match your desired color
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
    backgroundColor: "transparent", // No background
    borderRadius: 0,                // No rounded corners
    width: undefined,               // No fixed width
    height: undefined,              // No fixed height
    margin: 10,
    padding: 10,                    // Add padding for touch area
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
    backgroundColor: "#252525ff", // Set to match your desired color
    zIndex: 10,
  },
  mainSection: {
    flex: 1,
    position: "relative",
  },
});