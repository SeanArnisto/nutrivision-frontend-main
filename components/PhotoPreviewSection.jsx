import React, { useEffect, useState } from 'react';
import { SafeAreaView, Image, StyleSheet, View, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system/legacy';

const { width, height } = Dimensions.get('window');

const PhotoPreviewSection = ({ photo, onBack, onSubmit }) => {
  const [imageUri, setImageUri] = useState(null);
  const [processedUri, setProcessedUri] = useState(null); 

  useEffect(() => {
    const processPhotoUri = async () => {
      if (!photo || !photo.uri) return;

      try {
        if (Platform.OS === 'ios' && (photo.uri.startsWith('ph://') || photo.uri.startsWith('file://'))) {
          const fileName = `${Date.now()}.jpg`;
          const newUri = `${FileSystem.documentDirectory}${fileName}`;
          try {
            await FileSystem.copyAsync({
              from: photo.uri,
              to: newUri,
            });
            setImageUri(newUri);
            setProcessedUri(newUri);
          } catch (error) {
            console.log('Error copying file:', error);
            setImageUri(photo.uri);
            setProcessedUri(null);
          }
        } else {
          setImageUri(photo.uri);
          setProcessedUri(null);
        }
      } catch (error) {
        console.log('Error processing image URI:', error);
        setImageUri(photo.uri);
        setProcessedUri(null);
      }
    };

    processPhotoUri();
    return () => cleanupTemporaryFile();
  }, [photo]);

  const cleanupTemporaryFile = async () => {
    if (processedUri && processedUri.startsWith(FileSystem.documentDirectory)) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(processedUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(processedUri, { idempotent: true });
        }
      } catch (error) {
        console.log('Error cleaning up temporary file:', error);
      }
    }
  };

  if (!imageUri) return null;

  return (
    <View style={styles.container}>
      {/* Top Overlay */}
      <View style={styles.topOverlay} />

      {/* Full screen image */}
      <Image
        style={styles.fullScreenImage}
        source={{ uri: imageUri }}
        resizeMode="contain"
      />

      {/* Bottom Controls */}
      <View style={styles.bottomControlsContainer}>
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.returnButton} onPress={onBack}>
            <Ionicons name="return-down-back-outline" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.roundButton} onPress={onSubmit}>
            <Ionicons name="return-down-forward-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#252525ff', // Changed from '#000' to match top/bottom overlays
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent', // Let the container color show through
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80, // Adjust as needed for your top area
    backgroundColor: '#252525ff',
    zIndex: 10,
  },
  bottomControlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#252525ff', // Changed to match your desired color
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  roundButton: {
    backgroundColor: "transparent",
    borderRadius: 0,
    width: undefined,
    height: undefined,
    margin: 10,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
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
});

export default PhotoPreviewSection;