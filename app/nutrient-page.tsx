import React, { useEffect, useState, useCallback } from 'react';
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
import { useFonts } from 'expo-font';
import { ThemedText } from '@/components/ThemedText';
import { useNavigation } from 'expo-router';
import { RootStackParamList } from '@/types/types';
import { StackNavigationProp } from '@react-navigation/stack';
import * as MediaLibrary from 'expo-media-library';
import PieChart from 'react-native-pie-chart';
import { useRoute } from '@react-navigation/native';

//import  {useApi} from '@/hooks/ApiContext';

const { width, height } = Dimensions.get('window');

// Helper Function
const toPercentageText = (value: number): string => `${value}%`;
const formatValue = (value: number, unit: string = 'g'): string => `${value} ${unit}`;

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'index'>;

export default function UserNutrientPage() {
  const route = useRoute();
  const { data } = route.params as { data: any };
  const [fontsLoaded] = useFonts({
    'SpaceMono-Regular': require('@/assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [capturedPhotos, setCapturedPhotos] = useState<{ uri: string; type: string; orientation: string }[]>([]);
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState<boolean | null>(null);
  //const { extractedData } = useApi();

  // Navigation
  const navigation = useNavigation() as HomeScreenNavigationProp;

  useEffect(() => {
    if (data?.combined) {

  
      const parseGrams = (value: string | null | undefined): number => {
        if (!value) {
          return 0;
        }
      
        const lowerValue = value.toLowerCase();
      
        if (lowerValue.includes('mg')) {
          return parseFloat(value) / 1000;
        } else {
          return parseFloat(value);
        }
      };
  
      const carbohydrate = parseGrams(data.combined.carbs_total);
      const protein = parseGrams(data.combined.protein_total);
      const sodium = parseGrams(data.combined.sodium_total);
  
      setNutrients({ carbohydrate, protein, sodium });
  
      const total = ((carbohydrate + protein + sodium) / 3).toFixed(2);
  
      setNutritionData({
        userIntake: {
          breakdown: { carbohydrate, protein, sodium },
          total: parseFloat(total)
        }
      });
    }
  }, [data]);
  

  // State for nutrient inputs (now as numbers without units)
  const [nutrients, setNutrients] = useState({
    carbohydrate: 88,
    sodium: 1.83,
    protein: 3.5
  });

  const [isEditing, setIsEditing] = useState({
    carbohydrate: false,
    sodium: false,
    protein: false
  });

  interface NutritionData {
    userIntake: {
      breakdown: { carbohydrate: number; sodium: number; protein: number };
      total: number;
    };
  }
  

  const [nutritionData, setNutritionData] = useState<NutritionData>({
      userIntake: { 
        breakdown: { carbohydrate: 94, sodium: 2, protein: 4 },
        total: 93.33
      }
    });

    const textUserIntakeCarbohydrate = toPercentageText(nutritionData.userIntake.breakdown.carbohydrate);
    const textUserIntakeSodium = toPercentageText(nutritionData.userIntake.breakdown.sodium);
    const textUserIntake = toPercentageText(nutritionData.userIntake.breakdown.protein);

    const totalUserIntake = formatValue(nutritionData.userIntake.total);

    const donutSeries = [
      { value: nutritionData.userIntake.breakdown.protein, color: '#000000' },
      { value: nutritionData.userIntake.breakdown.sodium, color: '#c0b4b4' },
      { value: nutritionData.userIntake.breakdown.carbohydrate, color: '#7ca844' },
    ];

  // Toggle edit mode
  const toggleEdit = (key: 'sodium' | 'protein' | 'carbohydrate') => {
    setIsEditing(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Handle nutrient change
  const handleNutrientChange = (key: 'sodium' | 'protein' | 'carbohydrate', value: string) => {
    const numValue = parseInt(value) || 0;
    setNutrients(prev => ({ ...prev, [key]: numValue }));
  };

  // Request media library permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setMediaLibraryPermission(status === 'granted');
    })();
  }, []);

  // Load previously captured photos on mount
 // Request media library permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setMediaLibraryPermission(status === 'granted');
    })();
  }, []);

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
    navigation.navigate('page-6', data);
  };

  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }

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
                />
              </View>
              
              <View style={styles.userIntakeCard}>
                <Text style={styles.userText}>User </Text>
                <Text style={styles.intakeText}>Intake</Text>
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

              {/* Input section */}
              <View style={styles.inputSection}>
                {/* Sugar Input */}
                <View style={styles.inputRow}>
                  <Image source={require('@/assets/images/Carbohydrate Icon.png')} style={styles.icon} />
                  <Text style={styles.nutrientText}>Carbs</Text>
                  <View style={styles.divider} />
                  <View style={styles.inputBox}>
                    {isEditing.carbohydrate ? (
                      <TextInput
                        style={styles.input}
                        value={nutrients.carbohydrate.toString()}
                        onChangeText={(text) => handleNutrientChange('carbohydrate', text)}
                        autoFocus
                        onBlur={() => toggleEdit('carbohydrate')}
                        keyboardType="numeric"
                        textAlign="center"
                      />
                    ) : (
                      <>
                        <Text style={styles.inputText}>{nutrients.carbohydrate}</Text>
                        <TouchableOpacity 
                          style={styles.editButtonInside}
                          onPress={() => toggleEdit('carbohydrate')}
                        >
                          <Image source={require('@/assets/images/Edit Icon.png')} style={styles.editIcon} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>

                {/* Sodium Input */}
                <View style={styles.inputRow}>
                  <Image source={require('@/assets/images/Sodium Icon.png')} style={styles.icon} />
                  <Text style={styles.nutrientText}>Sodium</Text>
                  <View style={styles.divider} />
                  <View style={styles.inputBox}>
                    {isEditing.sodium ? (
                      <TextInput
                        style={styles.input}
                        value={nutrients.sodium.toString()}
                        onChangeText={(text) => handleNutrientChange('sodium', text)}
                        autoFocus
                        onBlur={() => toggleEdit('sodium')}
                        keyboardType="numeric"
                        textAlign="center"
                      />
                    ) : (
                      <>
                        <Text style={styles.inputText}>{nutrients.sodium}</Text>
                        <TouchableOpacity 
                          style={styles.editButtonInside}
                          onPress={() => toggleEdit('sodium')}
                        >
                          <Image source={require('@/assets/images/Edit Icon.png')} style={styles.editIcon} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>

                {/* Calories Input */}
                <View style={styles.inputRow}>
                  <Image source={require('@/assets/images/Protein Icon.png')} style={styles.icon} />
                  <Text style={styles.nutrientText}>Protein</Text>
                  <View style={styles.divider} />
                  <View style={styles.inputBox}>
                    {isEditing.protein ? (
                      <TextInput
                        style={styles.input}
                        value={nutrients.protein.toString()}
                        onChangeText={(text) => handleNutrientChange('protein', text)}
                        autoFocus
                        onBlur={() => toggleEdit('protein')}
                        keyboardType="numeric"
                        textAlign="center"
                      />
                    ) : (
                      <>
                        <Text style={styles.inputText}>{nutrients.protein}</Text>
                        <TouchableOpacity 
                          style={styles.editButtonInside}
                          onPress={() => toggleEdit('protein')}
                        >
                          <Image source={require('@/assets/images/Edit Icon.png')} style={styles.editIcon} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.chartsContainer}>
            {/* User Intake Donut Chart */}
            <View style={styles.chartBox}>
              <View style={styles.chartRow}>
                <View style={styles.chartWrapper}>
                  <PieChart
                    widthAndHeight={150}
                    series={[
                      { value: nutritionData.userIntake.breakdown.protein, color: '#000000' },
                      { value: nutritionData.userIntake.breakdown.sodium, color: '#c0b4b4' },
                      { value: nutritionData.userIntake.breakdown.carbohydrate, color: '#7ca844' },
                    ]}
                    cover={0.55}
                  />
                </View>
                <View style={styles.legendWrapper}>
                  <Text style={styles.chartTitle}>User Intake</Text>
                  <View style={styles.legendItem}>
                    <View style={[styles.colorCircle, { backgroundColor: '#7ca844' }]} />
                    <Text style={styles.legendLabel}>Carbohydrate ({toPercentageText(nutritionData.userIntake.breakdown.carbohydrate)})</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.colorCircle, { backgroundColor: '#c0b4b4' }]} />
                    <Text style={styles.legendLabel}>Sodium ({toPercentageText(nutritionData.userIntake.breakdown.sodium)})</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.colorCircle, { backgroundColor: '#000000' }]} />
                    <Text style={styles.legendLabel}>
                      Protein ({toPercentageText(nutritionData.userIntake.breakdown.protein)})</Text>
                  </View>
                  <View style={styles.totalBox}>
                    <Text style={styles.totalText}>
                      Total Nutrient{'\n'}Amount = {formatValue(nutritionData.userIntake.total)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
            </View>
          </ScrollView>
      </KeyboardAvoidingView>
          
      {/* Floating check button */}
      <TouchableOpacity style={styles.checkButton} onPress={handleCheck}>
        <ThemedText style={styles.checkMark}>➜</ThemedText>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const screenWidth = Dimensions.get('window').width;
const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
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
    height: 60,
    resizeMode: 'contain',
    alignSelf: 'flex-start',
  },
  userIntakeCard: {
    marginTop: -15,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  userText: {
    color: '#9AB206',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono-Regular',
  },
  intakeText: {
    color: '#4D4444',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono-Regular',
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
    marginTop: 20
  },
  inputSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 7.5,
    marginHorizontal: 8,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  nutrientText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4D4444',
  },
  editIcon: {
    width: 13,
    height: 13,
  },
  editButtonInside: {
    position: 'absolute',
    right: 5,
    top: '50%',
    transform: [{ translateY: -8 }], // Center vertically (half of icon height)
  },
  inputBox: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    width: 80,
    height: 40,
    justifyContent: 'center',
    position: 'relative', // Added to position the edit icon inside
  },
  inputText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: '100%',
    fontSize: 14,
    color: '#333',
    padding: 0,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#DDDDDD',
    flex: 1, // Makes it take up available space
    marginHorizontal: 10,
  },
  innerRow: {
    flexDirection: 'row',
  },
  newLeftColumn: {
    flex: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newRightColumn: {
    flex: 40,
    paddingLeft: 10,
    justifyContent: 'center',
    gap: 6,
  },
  newLegendTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: -20
  },
  newLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  newCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  newLegendText: {
    fontSize: 14,
    color: '#333',
  },
  newTotalBox: {
    backgroundColor: '#f8e4e4',
    marginTop: 10,
    padding: 10,
    borderRadius: 15,
    alignItems: 'flex-start',
    marginLeft: -20,
  },
  newTotalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'left'
  },
  chartsContainer: {
    gap: 16,
  },
  chartBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  chartRow: {
    flexDirection: 'row',
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendItemSpacing: {
    marginLeft: 24, // Additional spacing for the second legend
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  colorCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 12,
  },
  legendLabel: {
    fontSize: 12,
    color: '#333',
  },
  totalBox: {
    backgroundColor: '#f8e4e4',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  totalText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'left',
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

