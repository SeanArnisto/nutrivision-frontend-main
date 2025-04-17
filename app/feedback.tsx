import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { 
  View, 
  Image, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Platform, 
  ScrollView, 
  SafeAreaView, 
  TextInput,
  KeyboardAvoidingView
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/types';
import * as MediaLibrary from 'expo-media-library';
import axios from 'axios';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'index'>;

type sugar = {sugar: number, approxSugar: number, sugarTablespoon: number}
type sodium = {sodium: number, approxSodium: number, sodiumTablespoon: number}
type calories = {calories: number, approxCalories: number, caloriesTablepoon: number}

function Feedback() {
    const navigation = useNavigation() as HomeScreenNavigationProp;
    const [capturedPhotos, setCapturedPhotos] = useState<{ uri: string; type: string; orientation: string }[]>([]);
    const [mediaLibraryPermission, setMediaLibraryPermission] = useState<boolean | null>(null);
    const [sugar, setSugar] = useState<sugar>({sugar: 0, approxSugar: 0, sugarTablespoon: 0});
    const [sodium, setSodium] = useState<sodium>({sodium: 0, approxSodium: 0, sodiumTablespoon: 0});
    const [calories, setCalories] = useState<calories>({calories: 0, approxCalories: 0, caloriesTablepoon: 0});
    const [requrestMessage, setRequestMessage] = useState<string>('');


    // Request media library permissions on mount
      useEffect(() => {
        (async () => {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          setMediaLibraryPermission(status === 'granted');
        })();
      }, []);
    
      // Load previously captured photos on mount
      useFocusEffect(
        useCallback(() => {
          if (mediaLibraryPermission) {
            loadRecentPhotos();
          }
      
          return () => {
            // Optional: reset or cancel something if needed
            console.log('Leaving the screen');
          };
        }, [mediaLibraryPermission])
      );
    
      const loadRecentPhotos = async () => {
        try {
          // First, get the NutriVision album
          const album = await MediaLibrary.getAlbumAsync("NutriVision");
          
          // If the album doesn't exist yet, return empty array
          if (!album) {
            console.log('NutriVision album not found');
            setCapturedPhotos([]);
            return;
          }
          
          // Get assets from the NutriVision album specifically
          const { assets } = await MediaLibrary.getAssetsAsync({
            album: album.id,
            first: 5,
            mediaType: 'photo',
            sortBy: ['creationTime']
          });
      
          const recentPhotos = [];
          for (const asset of assets) {
            let uriToUse = asset.uri;
            if (Platform.OS === 'ios' && uriToUse.startsWith('ph://')) {
              try {
                const info = await MediaLibrary.getAssetInfoAsync(asset);
                if (info.localUri) {
                  uriToUse = info.localUri;
                }
              } catch (error) {
                console.error('Error getting localUri for asset:', error);
              }
            }
            
            recentPhotos.push({
              uri: uriToUse,
              type: Math.random() > 0.5 ? 'label' : 'fruit',
              orientation: Math.random() > 0.5 ? 'vertical' : 'horizontal'
            });
          }
      
          setCapturedPhotos(recentPhotos.filter(photo => 
            photo.uri && typeof photo.uri === 'string'
          ));
        } catch (error) {
          console.error('Error loading photos from NutriVision album:', error);
        }
      };
    

    const handleCheck = () => {
        navigation.navigate('index');
      };

    const testRequest = async () => {
      const [response, setResponse] = useState('');

      const handleSubmit = () =>{
        // axios.get()
      }
    };

    function SpoonImages({ spoonDisplay }: { spoonDisplay: number }) {
      let imageToDisplay = require('@/assets/images/neutral.png'); // Default image

      return (
        <View style={styles.rightContainer}> 
          <Image
            source={imageToDisplay}
            style={styles.image}
          />
        </View>
      );
    };
      
    return (
        <SafeAreaView style={styles.safeContainer}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0} // Adjust as needed
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.container}>
                        <View style={styles.header}>
                            <Image 
                                source={require('@/assets/images/NutriVision.png')} 
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
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

                        {/* sugar table */}
                        <View style={styles.sugarContainer}>
                         <View style={styles.textContainer}>
                            <Text style={styles.textHeader}>
                              Sugar: {sugar.sugar} g
                            </Text>
                            <Text style={styles.textSubHeader}>
                              Approx Sugar: {sugar.approxSugar} grams
                            </Text>
                            <Text style={styles.textSubHeader}>
                              Equivalent to: {sugar.sugarTablespoon} tablespoons
                            </Text>
                          </View>
                          <SpoonImages spoonDisplay={1} />
                        </View>
                        {/* sodium table */}
                        <View style={styles.sugarContainer}>
                          <View style={styles.textContainer}>
                            <Text style={styles.textHeader}>
                              Sodium: {sodium.sodium} g
                            </Text>
                            <Text style={styles.textSubHeader}>
                              Approx Sodium: {sodium.approxSodium} grams
                            </Text>
                            <Text style={styles.textSubHeader}>
                              Equivalent to: {sodium.approxSodium} tablespoons
                            </Text>
                          </View>
                          <SpoonImages spoonDisplay={1} />
                      </View>  
                      {/* calories table */}
                      <View style={styles.sugarContainer}>
                          <View style={styles.textContainer}>
                          <Text style={styles.textHeader}>
                            Calories: {calories.calories} g
                            </Text>
                            <Text style={styles.textSubHeader}>
                              Approx calories: {calories.approxCalories} grams
                            </Text>
                            <Text style={styles.textSubHeader}>
                              Equivalent to: {calories.caloriesTablepoon} tablespoons
                            </Text>
                          </View>
                          <SpoonImages spoonDisplay={1} />
                        </View>  
                        <View style={styles.FeedbackContainer}>  
                          <View style={styles.textContainer}>
                            <Text>
                              to follow up dependent on the user input.
                            </Text>
                          </View>
                        </View>
                    </View>
                      
                                                   
                </ScrollView>                
            </KeyboardAvoidingView>
            <TouchableOpacity style={styles.checkButton} onPress={handleCheck} disabled={false}>
                    <Image 
                        source={require('@/assets/images/Home.png')} 
                        style={{ width: 30, height: 30 }} // Adjust the size as needed
                    />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  image: {
    width: SCREEN_WIDTH * 0.35, // Responsive width (25% of screen)
    height: 50,
    resizeMode: 'contain',
    backgroundColor: 'white',
  },
  rightContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 5,
    backgroundColor: 'white'
  },
  sugarContainer: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 0.9,
    height: 70,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'space-between', // Changed from 'center' to better distribute content
    alignItems: 'center', // Added to vertically center items
    backgroundColor: 'white', // Match the container background color
    // Use platform-specific styling for consistent shadows
    ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
    android: {
      elevation: 4,
    },
    }),
    paddingHorizontal: 15, // Add some horizontal padding
    marginBottom: 15, // Add some margin between items
  },
  FeedbackContainer: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 0.9,
    height: 320,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'space-between', // Changed from 'center' to better distribute content
    alignItems: 'center', // Added to vertically center items
    backgroundColor: 'white', // Match the container background color
    // Use platform-specific styling for consistent shadows
    ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
    android: {
      elevation: 4,
    },
    }),
    paddingHorizontal: 15, // Add some horizontal padding
    marginBottom: 15, // Add some margin between items
  },
  textHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4D4444',
    paddingBottom: 1,
    paddingLeft: -5,
  },
  textContainer: {
    flex: 1, // Take available space
    backgroundColor: 'white'
  },
  textSubHeader: {
    fontSize: 12,
    color: '#9D9696',
    paddingLeft: -5,
  },
  safeContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Add space for floating button
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
  },
  header: {
    marginLeft: -15,
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  logo: {
    width: 200,
    height: 150,
  },
  thumbnailSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
  },
  thumbnailWrapper: {
    width: '100%',
  },
  thumbnailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    marginHorizontal: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    color: 'gray',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 20,
  },
  checkButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    fontSize: 25,
    color: '#9AB206',
    fontWeight: 'bold',
  },
});

export default Feedback;
