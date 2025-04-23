import React, {
  useRef,
  useState,
  useEffect,
  createContext,
  useContext,
} from "react";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Switch,
  Image,
  ScrollView,
  Platform,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as ImageManipulator from "expo-image-manipulator";
import { useNavigation } from "@react-navigation/native";
import { useNutrientsStore } from "@/hooks/store";
import axios from "axios";
import PhotoPreviewSection from "@/components/PhotoPreviewSection";
import { navigate } from "expo-router/build/global-state/routing";
import { useRoute } from "@react-navigation/native";
import Loading from "./loading";

const { height } = Dimensions.get("window");

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

export default function Camera() {
  //const MyContext = createContext();
  const route = useRoute();
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [isLabelMode, setIsLabelMode] = useState(true); // Default to label mode
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submit, setSubmit] = useState(false);

  //const { setExtractedData } = useApi();
  // Always vertical (portrait) orientation. No toggle.
  const boxOrientation = "vertical";

  const setCarbs = useNutrientsStore((state) => state.carbs);
  const setProtein = useNutrientsStore((state) => state.protein);
  const setSodium = useNutrientsStore((state) => state.sodium);

  const { nutritionData } = route.params || {}; // Retrieve the passed data
  console.log("Nutrition data from route params:", nutritionData);

  const handleSubmitPhoto = async (photos) => {
    console.log("Button clicked, starting image submission...");
    setSubmit(true);
    setTimeout(() => setSubmit(false), 5000);
    setLoading(true); // Set loading state

    const fruitsUrl = "https://leidanielaguila-nutrivision.hf.space/detect"; // object detection
    const labelsUrl =
      "https://nutrivision-backend-textrecog-77tx.onrender.com/extract/"; // nutritional label

    if (!photos || photos.length === 0) {
      console.log("No photos provided for submission.");
      setLoading(false);
      return;
    }

    // Create a new FormData object
    const formData = new FormData();

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const uriParts = photo.uri.split(".");
      const fileType = uriParts[uriParts.length - 1];

      // Platform-specific URI handling
      const uri =
        Platform.OS === "android"
          ? photo.uri
          : photo.uri.replace("file://", "");

      // Properly append file to FormData
      formData.append("files", {
        uri: uri,
        name: `photo_${i}.${fileType}`,
        type: `image/${fileType}`,
      });
    }

    let urlToSend = isLabelMode ? labelsUrl : fruitsUrl;

    try {
      console.log("Sending request to backend endpoint using fetch...");

      const response = await fetch(urlToSend, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();

      if (data?.combined) {
        console.log("data from nutrilabel");
        setCarbs(data.combined.carbs_total);
        setProtein(data.combined.protein_total);
        setSodium(data.combined, sodium_total);
      }

      if (data?.fruits) {
        console.log("data from fruits");
        setCarbs(data.fruits.total_carbs);
        setProtein(data.fruits.total_protein);
        setSodium(data.fruits.total_sodium);
      }

      setLoading(false); // Turn off loading when response is received
      navigation.navigate("nutrient-page", {
        data: data,
        nutritionData: nutritionData,
      });
      return data;
    } catch (err) {
      setLoading(false);
      console.error("❌ Fetch upload error:", err.message);

      // Show error to user
      Alert.alert(
        "Upload Failed",
        "Could not upload image. Please try again later.",
        [{ text: "OK" }]
      );

      throw err;
    }
  };
  const navigation = useNavigation();
  // Always use the back camera. No toggle.
  const facing = "back";

  const cameraRef = useRef(null);

  // useEffect(() => {
  //   console.log("Screen MOUNTED");
  //   return () => console.log("Screen UNMOUNTED");
  // }, []);

  // Add this function inside the Camera component before the useEffect
  const loadExistingPhotos = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("Media library permission not granted");
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
        first: 5, // Limit to 5 most recent photos
        sortBy: ["creationTime"],
        reverse: true,
      });

      console.log("Found assets:", assets.length); // Debug log

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
              type: "label", // or determine type from metadata if available
              id: asset.id,
            };
          } catch (error) {
            console.error("Error processing asset:", error);
            return null;
          }
        })
      );

      const validPhotos = photos.filter((photo) => photo !== null);
      console.log("Valid photos:", validPhotos.length); // Debug log

      setCapturedPhotos(validPhotos);
    } catch (error) {
      console.error("Error loading existing photos:", error);
    }
  };

  // Request media library permissions on mount
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

  // --- Permission checks for camera ---
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

  // --- Handlers ---
  function handleGoBack() {
    navigation.goBack();
  }

  function toggleMode() {
    setIsLabelMode((prev) => !prev);
  }

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      const options = { quality: 1, base64: true, exif: false };
      const takenPhoto = await cameraRef.current.takePictureAsync(options);

      if (isLabelMode) {
        // Label mode - crop the image according to guide box
        const cropWidth = takenPhoto.width * 0.7; // 70% width
        const cropHeight = takenPhoto.height * 0.6; // 60% height
        const originX = (takenPhoto.width - cropWidth) / 2;
        const originY = (takenPhoto.height - cropHeight) / 2; // Adjust for marginBottom

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
        // Fruit mode - use the full image
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

      // Use the processed URI if available, otherwise the original
      const uriToSave = processedUri || photo.uri;
      const asset = await MediaLibrary.createAssetAsync(uriToSave);

      // For iOS, get the proper local URI
      let localUri = asset.uri;
      if (Platform.OS === "ios") {
        const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
        localUri = assetInfo.localUri || assetInfo.uri;
      }

      // Save to "NutriVision" album
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

      // Create the photoWithId object with the proper URI format
      const photoWithId = {
        ...photo,
        uri:
          Platform.OS === "ios"
            ? `file://${localUri.replace("ph://", "")}`
            : localUri,
        id: asset.id,
        type: photo.type || "label",
      };

      // Update local state
      setCapturedPhotos((prev) => {
        const newPhotos = [photoWithId, ...prev].slice(0, 5);
        console.log("Updated photos:", newPhotos); // Debug log
        return newPhotos;
      });

      // Reload photos from gallery to ensure consistency
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

      // Get the album first
      const album = await MediaLibrary.getAlbumAsync("NutriVision");
      if (!album) {
        console.log("NutriVision album not found");
        return;
      }

      // Get all assets from the album
      const { assets } = await MediaLibrary.getAssetsAsync({
        album: album.id,
        mediaType: ["photo"],
      });

      console.log("Found assets in album:", assets.length);

      // Clean up URIs for comparison
      const cleanUri = (uri) => {
        if (!uri) return "";
        return uri
          .replace("ph://", "")
          .replace("file://", "")
          .split("?")[0]
          .split("#")[0];
      };

      // Try to find the asset to delete
      let assetToDelete;

      if (photoToDelete.id) {
        // First try by ID
        assetToDelete = assets.find((asset) => asset.id === photoToDelete.id);
      }

      if (!assetToDelete) {
        // If not found by ID, try by URI
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
        const success = await MediaLibrary.deleteAssetsAsync([
          assetToDelete.id,
        ]);
        if (success) {
          // Remove from local state only after successful deletion
          setCapturedPhotos((prev) => prev.filter((_, i) => i !== index));
          console.log("Photo deleted successfully");

          // Reload the gallery to ensure consistency
          await loadExistingPhotos();
        } else {
          throw new Error("Failed to delete asset");
        }
      } else {
        console.log("Asset not found in album");
        // Remove from local state even if asset not found
        setCapturedPhotos((prev) => prev.filter((_, i) => i !== index));
      }
    } catch (error) {
      console.error("Delete photo error:", error);
      Alert.alert("Error", "Failed to delete photo. Please try again.");
    }
  };

  // --- If we have a photo, show preview with "Back" + "Submit" buttons. ---
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

  // Update the return statement layout
  return (
    <View style={styles.container}>
      {/* Top section for thumbnails */}
      <View style={styles.topSection}>
        <SafeAreaView>
          <View style={styles.thumbnailsRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Increase touch area
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

      {/* Main camera section with flex */}
      <View style={styles.mainSection}>
        {/* Mode Selector */}
        <View style={styles.modeSelectorWrapper}>
          <View style={styles.switchContainer}>
            <Text
              style={[
                styles.switchLabel,
                isLabelMode ? styles.activeSwitchLabel : {},
              ]}
            >
              Labels
            </Text>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isLabelMode ? "lightgreen" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleMode}
              value={!isLabelMode}
            />
            <Text
              style={[
                styles.switchLabel,
                !isLabelMode ? styles.activeSwitchLabel : {},
              ]}
            >
              Fruits
            </Text>
          </View>
        </View>

        {/* Camera View */}
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          {/* Overlay + guide box (only in label mode) */}
          <View style={styles.overlay}>
            {isLabelMode && (
              <View style={[styles.guideBox, styles.labelGuideBox]} />
            )}
          </View>

          {/* Bottom Controls: Left = Back, Center = Capture, Right = Submit (disabled if no photo) */}
          <View style={styles.bottomControlsContainer}>
            <View style={styles.bottomControls}>
              {/* LEFT: Go Back */}
              <TouchableOpacity
                style={styles.roundButton}
                onPress={handleGoBack}
                disabled={false}
              >
                <Ionicons name="arrow-back" size={28} color="white" />
              </TouchableOpacity>

              {/* CENTER: Capture */}
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleTakePhoto}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              {/* RIGHT: Submit Photo (disabled because no photo yet) */}
              <TouchableOpacity
                style={[styles.roundButton, { opacity: submit ? 0.5 : 1 }]}
                onPress={() => handleSubmitPhoto(capturedPhotos)}
                disabled={submit}
              >
                <Ionicons name="checkmark" size={28} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    </View>
  );
}
//tite
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
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 5,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
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
    overflow: "visible", // Changed from 'hidden' to show delete button
    elevation: 3,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
  },
  deleteButton: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 24, // Increased from 20
    height: 24, // Increased from 20
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2, // Ensure it's above the image
    elevation: 4, // For Android
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
    borderColor: "lightgreen", // Yellow
    width: "70%",
    height: "60%",
  },
  fruitGuideBox: {
    borderColor: "#81b0ff", // Blue
  },

  // Bottom "Labels/Fruits" switch
  modeSelectorWrapper: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: "center",
  },
  modeSelectorBottom: {
    alignItems: "center",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
    maxWidth: 250,
    marginHorizontal: "auto",
  },
  switchLabel: {
    color: "#999",
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  activeSwitchLabel: {
    color: "white",
    fontWeight: "bold",
  },

  // Bottom controls - updated to match UI in mockup
  bottomControls: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  // New rounded button style to match the image
  roundButton: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "rgba(144, 238, 144, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
  },

  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(144, 238, 144, 0.8)",
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
    borderColor: "rgba(144, 238, 144, 1)",
  },
  bottomControlsContainer: {
    position: "absolute", // Changed from 'bottom' to 'absolute'
    bottom: 0, // Changed from 10 to 0 to extend to the very bottom
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
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
  cameraWrapper: {
    flex: 1,
    position: "relative",
  },
  thumbnailsContainer: {
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
  topSection: {
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
  mainSection: {
    flex: 1,
    position: "relative",
  },
});
