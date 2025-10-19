import React from "react";
import {
  View,
  ScrollView,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/types'; // Import your types
import { useDetailedNutrientStore } from '@/stores/useDetailedNutrientStore';


interface PhotoThumbnailGalleryProps {
  showHorizontalIndicator?: boolean;
  onImageError?: (index: number) => void;
  onPhotoPress?: (photoData: any, index: number) => void; // Updated to use actual data
}

// Use proper navigation type from your RootStackParamList
type NavigationProp = StackNavigationProp<RootStackParamList>;

export const PhotoThumbnailGallery: React.FC<PhotoThumbnailGalleryProps> = ({
  showHorizontalIndicator = false,
  onImageError,
  onPhotoPress,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { intakes } = useDetailedNutrientStore();

  const handleImageError = (index: number) => {
    console.log(`Image failed to load at index: ${index}`);
    onImageError?.(index);
  };

  const handlePhotoPress = (intake: any, index: number) => {
    console.log(`Photo pressed at index: ${index}`, intake);

    // If custom handler is provided, use it
    if (onPhotoPress) {
      onPhotoPress(intake, index);
      return;
    }

    // Route to different pages based on image type
    try {
      const nutritionalData = {
        carbs: intake.carbs,
        sodium: intake.sodium,
        protein: intake.protein,
        calories: intake.calories,
        servings: intake.servings,
        type: intake.type
      };

      // Get the image URI - handle both string and object formats
      const imageUri = typeof intake.imageUrl === 'string'
        ? intake.imageUrl
        : (intake.imageUrl as any)?.uri || '';

      // Determine navigation based on detected fruit type or image type
      const isDetectedFruit = intake.type && !['fruit', 'label'].includes(intake.type);

      if (isDetectedFruit || intake.type === 'fruit' || (intake.imageUrl as any)?.type === 'fruit') {
        // Navigate to fruit details page
        navigation.navigate('photo-fruit-details', {
          imageUri,
          nutritionalData
        });
      } else if (intake.type === 'label' || (intake.imageUrl as any)?.type === 'label') {
        // Navigate to label details page
        navigation.navigate('photo-label-details', {
          imageUri,
          nutritionalData
        });
      } else {
        // Default behavior for unknown types - go to fruit page for detected items
        console.warn(`Unknown photo type: ${intake.type}, defaulting to fruit page`);
        navigation.navigate('photo-fruit-details', {
          imageUri,
          nutritionalData
        });
      }
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert(
        'Navigation Error',
        'Unable to open photo details. Please try again.'
      );
    }
  };

  // Show message when no photos
  if (!intakes || intakes.length === 0) {
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
          {intakes.map((intake, index) => (
            <TouchableOpacity
              key={index}
              style={styles.thumbnailContainer}
              onPress={() => handlePhotoPress(intake, index)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`View photo ${index + 1}`}
            >
              <Image
                source={{
                  uri: typeof intake.imageUrl === 'string'
                    ? intake.imageUrl
                    : (intake.imageUrl as any)?.uri || ''
                }}
                style={styles.thumbnail}
                onError={() => handleImageError(index)}
                resizeMode="cover"
              />

              {/* Optional: Add a subtle overlay to indicate it's clickable */}
              <View style={styles.clickableOverlay} />

              {/* Optional: Add type indicator */}
              {/* {intake.type && (
                <View style={[
                  styles.typeIndicator,
                  (intake.type === 'label' || (intake.imageUrl as any)?.type === 'label')
                    ? styles.labelIndicator
                    : styles.fruitIndicator
                ]}>
                  <Text style={styles.typeText}>

                  </Text>
                </View>
              )} */}
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
    minWidth: 30,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  labelIndicator: {
    backgroundColor: "#2dcc14ff",
  },
  fruitIndicator: {
    backgroundColor: "#81b0ff",
  },
  typeText: {
    fontSize: 6,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
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