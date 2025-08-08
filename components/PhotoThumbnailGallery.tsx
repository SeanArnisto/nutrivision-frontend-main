import React from "react";
import { View, ScrollView, Image, Text, StyleSheet } from "react-native";

interface PhotoItem {
  uri: string;
  type: string;
  orientation: string;
}

interface PhotoThumbnailGalleryProps {
  photos: PhotoItem[];
  showHorizontalIndicator?: boolean;
  onImageError?: (index: number) => void;
}

export const PhotoThumbnailGallery: React.FC<PhotoThumbnailGalleryProps> = ({
  photos,
  showHorizontalIndicator = false,
  onImageError,
}) => {
  const handleImageError = (index: number) => {
    console.log("Image failed to load");
    onImageError?.(index);
  };

  return (
    <View style={styles.thumbnailSection}>
      <View style={styles.thumbnailWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={showHorizontalIndicator}
          contentContainerStyle={styles.thumbnailsRow}
        >
          {photos.map((item, index) => (
            <View key={index} style={styles.thumbnailContainer}>
              <Image
                source={{ uri: item.uri }}
                style={styles.thumbnail}
                onError={() => handleImageError(index)}
              />
            </View>
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
});

export default PhotoThumbnailGallery;
