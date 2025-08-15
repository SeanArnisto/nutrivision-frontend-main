import React from "react";
import {
  View,
  ScrollView,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types"; // Import your types

interface PhotoItem {
  uri: string;
  type: string;
  orientation: string;
}

interface NutritionalData {
  carbs: number;
  sodium: number;
  protein: number;
  servings: number;
}

interface PhotoThumbnailGalleryProps {
  photos: PhotoItem[];
  showHorizontalIndicator?: boolean;
  onImageError?: (index: number) => void;
  nutritionalData: NutritionalData; // Optional nutrition data to pass
  onPhotoPress?: (photo: PhotoItem, index: number) => void; // Optional custom handler
}

// Use proper navigation type from your RootStackParamList
type NavigationProp = StackNavigationProp<RootStackParamList>;

export const PhotoThumbnailGallery: React.FC<PhotoThumbnailGalleryProps> = ({
  photos,
  showHorizontalIndicator = false,
  onImageError,
  nutritionalData,
  onPhotoPress,
}) => {
  const navigation = useNavigation<NavigationProp>();

  const handleImageError = (index: number) => {
    console.log(`Image failed to load at index: ${index}`);
    onImageError?.(index);
  };

  const handlePhotoPress = (photo: PhotoItem, index: number) => {
    console.log(`Photo pressed at index: ${index}`, photo);

    // If custom handler is provided, use it
    if (onPhotoPress) {
      onPhotoPress(photo, index);
      return;
    }

    // Default behavior: navigate to photo-label-details screen
    try {
      navigation.navigate("photo-label-details", {
        imageUri: photo.uri,
        nutritionalData: nutritionalData ?? {
          carbs: 18,
          sodium: 1.8,
          protein: 2,
          servings: 1,
        },
      });
    } catch (error) {
      console.error("Navigation error:", error);
      Alert.alert(
        "Navigation Error",
        "Unable to open photo details. Please try again."
      );
    }
  };

  // Show message when no photos
  if (!photos || photos.length === 0) {
    return (
      <View style={styles.thumbnailSection}>
        <Text style={styles.placeholderText}>No photos available</Text>
      </View>
    );
  }

  return (
    <View style={styles.thumbnailSection}>
      <View style={styles.thumbnailWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={showHorizontalIndicator}
          contentContainerStyle={styles.thumbnailsRow}
        >
          {photos.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.thumbnailContainer}
              onPress={() => handlePhotoPress(item, index)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`View photo ${index + 1}`}
            >
              <Image
                source={{ uri: item.uri }}
                style={styles.thumbnail}
                onError={() => handleImageError(index)}
                resizeMode="cover"
              />

              {/* Optional: Add a subtle overlay to indicate it's clickable */}
              <View style={styles.clickableOverlay} />

              {/* Optional: Add type indicator */}
              {item.type && (
                <View
                  style={[
                    styles.typeIndicator,
                    item.type === "label"
                      ? styles.labelIndicator
                      : styles.fruitIndicator,
                  ]}
                >
                  <Text style={styles.typeText}>
                    {item.type === "label" ? "L" : "F"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  clickableOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
  typeIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  labelIndicator: {
    backgroundColor: "#f5dd4b",
  },
  fruitIndicator: {
    backgroundColor: "#81b0ff",
  },
  typeText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "white",
  },
  placeholderText: {
    color: "gray",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    fontStyle: "italic",
  },
});

export default PhotoThumbnailGallery;
