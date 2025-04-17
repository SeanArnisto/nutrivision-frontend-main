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

type carbohydrate = {carbohydrate: number, approxCarbohydrate: number, carbohydrateTablespoon: number}
type sodium = {sodium: number, approxSodium: number, sodiumTablespoon: number}
type protein = {protein: number, approxProtein: number, proteinTablepoon: number}

function Feedback() {
    const navigation = useNavigation() as HomeScreenNavigationProp;
    const [capturedPhotos, setCapturedPhotos] = useState<{ uri: string; type: string; orientation: string }[]>([]);
    const [mediaLibraryPermission, setMediaLibraryPermission] = useState<boolean | null>(null);
    const [carbohydrate, setCarbohydrate] = useState<carbohydrate>({carbohydrate: 200, approxCarbohydrate: 0, carbohydrateTablespoon: 0});
    const [sodium, setSodium] = useState<sodium>({sodium: 0, approxSodium: 0, sodiumTablespoon: 0});
    const [protein, setCalories] = useState<protein>({protein: 0, approxProtein: 0, proteinTablepoon: 0});
    const [requrestMessage, setRequestMessage] = useState<string>('');
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(true);


    // TEMP test values — rename to avoid conflict with existing state
    const testProtein = 60;
    const testCarbs = 150;
    const testSodium = 1800;


    // Request media library permissions on mount
      useEffect(() => {
        (async () => {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          setMediaLibraryPermission(status === 'granted');
        })();
      }, []);

      useEffect(() => {
      const fetchFeedback = async () => {
        const result = await getNutritionFeedback(
          testProtein.toString(),
          testCarbs.toString(),
          testSodium.toString(),
        );
        setFeedback(result);
        setLoading(false);
      };

      fetchFeedback();
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
    
    const getNutritionFeedback = async (
      protein: string,
      carbs: string,
      sodium: string,
    ): Promise<string> => {
      //const API_URL = '';
      //const API_TOKEN = ''; // Replace this

      const headers = {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      };

      const prompt = `
    You're a nutritionist. Give a short, clear feedback on this nutrient info:

    Protein: ${testProtein}  
    Carbs: ${testCarbs}  
    Sodium: ${testSodium}  

    Mention if it's balanced or not, and provide suggestions and assume that this is an average male with average everything.
    `;

      try {
        const response = await axios.post(API_URL, { inputs: prompt }, { headers });
        const result = response.data;

        if (Array.isArray(result) && result[0]?.generated_text) {
          return result[0].generated_text;
        } else if (result?.generated_text) {
          return result.generated_text;
        } else {
          return 'No feedback generated.';
        }
      } catch (error) {
        console.error('Hugging Face API error:', error);
        return 'Error fetching feedback.';
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
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Image
                              source={require('@/assets/images/Carbohydrate Icon.png')} // update path if needed
                              style={{ width: 15, height: 15, marginRight: 5 }}
                            />
                            <Text style={styles.textHeader}>
                              Carbs: {carbohydrate.carbohydrate} g
                            </Text>
                          </View>
                          <Text style={styles.textSubHeader}>
                            Approx calories: {carbohydrate.approxCarbohydrate} grams
                          </Text>
                          <Text style={styles.textSubHeader}>
                            Equivalent to: {carbohydrate.carbohydrateTablespoon} tablespoons
                          </Text>
                        </View>

                        {/* Wrapper for legend and spoon */}
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 10, color: '#b9b2b2', marginBottom: 4 }}>
                            1 tbsp = 15 grams
                          </Text>
                          <SpoonImages spoonDisplay={1} />
                        </View>
                      </View>


                        {/* sodium table */}
                        <View style={styles.sugarContainer}>
                          <View style={styles.textContainer}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Image
                                source={require('@/assets/images/Sodium Icon.png')} // update the path as needed
                                style={{ width: 20, height: 20, marginRight: 5 }}
                              />
                              <Text style={styles.textHeader}>
                                Sodium: {sodium.sodium} g
                              </Text>
                            </View>
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
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Image
                                source={require('@/assets/images/Protein Icon.png')} // update path if needed
                                style={{ width: 20, height: 20, marginRight: 5 }}
                              />
                              <Text style={styles.textHeader}>
                                Protein: {protein.protein} g
                              </Text>
                            </View>
                            <Text style={styles.textSubHeader}>
                              Approx Protein: {protein.approxProtein} grams
                            </Text>
                            <Text style={styles.textSubHeader}>
                              Equivalent to: {protein.proteinTablepoon} tablespoons
                            </Text>
                          </View>
                          <SpoonImages spoonDisplay={1} />
                        </View>
                        <View style={styles.FeedbackContainer}>  
                          <View style={styles.textContainer}>
                          {loading ? (
                            <Text className="text-center text-gray-500">Generating feedback...</Text>
                          ) : (
                            <Text className="text-base text-gray-800 mt-4">{feedback}</Text>
                          )}
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
    height: 80,
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
