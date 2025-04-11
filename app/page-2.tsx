import React from 'react';
import { StyleSheet, View, Image, Dimensions, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/types';



type Page2ScreenNavigationProp = StackNavigationProp<RootStackParamList, 'page-2'>;

export default function Page2() {
  const navigation = useNavigation<Page2ScreenNavigationProp>();
  const { width } = Dimensions.get('window');
  const handleCheck = () => {
    navigation.navigate('camera');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        {/* Logo kept from original */}
        <Image
          source={require('@/assets/images/NutriVision.png')}
          style={styles.logo}
          accessibilityRole="image"
          accessibilityLabel="NutriVision logo"
        />
        <ThemedView style={styles.container}>
        {/* Add your new page-2 content here */}
        <View style={styles.profileBox}>
                        <ThemedText style={styles.profileBoxText}>
                          Average <ThemedText style={styles.profileText}>Daily</ThemedText> Intake
                        </ThemedText>
                      </View>
          <View style={styles.rowContainer}>
      {/* Container 1 */}
      <View style={[styles.column]}>
        {<View style={styles.textRow}>
        <Text style={styles.title}>310g</Text>
        </View>
    }
        <View style={styles.textRow}>
        <Text style={styles.subtitle}>Carbohydrate</Text>
        </View>
        {/* Circular Progress with Image */}
    
      <View style={styles.textRow}> 
        <View style={styles.progressRow}>
      <View style={{ alignItems: 'flex-start', marginTop: 10}}>
  <AnimatedCircularProgress style={{ transform: [{ rotate: '90deg' }, { scaleX: -1 }] }}
    size={95}
    width={10}
    fill={100} // Percentage fill
    tintColor="#d5cd3a"
    backgroundColor="#dddddd"
  >
    {
      () => (
        <Image 
          source={require('@/assets/images/Carbohydrate Icon.png')} // Change this to your desired image
          style={{ 
            width: 40,
            height: 40,
            borderRadius: 20,
            transform: [{ rotate: '450deg' }, { scaleX: -1 }],
          }}
          resizeMode="contain"
        />
      )
    }
  </AnimatedCircularProgress>
</View>
  </View>
    </View>

      </View>

      {/* Container 2 */}
      <View style={[styles.column]}>
        {/* Your content */}
        {<View style={styles.textRow}>
        <Text style={styles.title}>28g</Text>
        </View>}
        <View style={styles.textRow}>
        <Text style={styles.subtitle}>Sodium</Text>
        </View>
        {/* Circular Progress with Image */}
        <View style={styles.textRow}> 
        <View style={styles.progressRow}>
      <View style={{ alignItems: 'flex-start', marginTop: 10}}>
  <AnimatedCircularProgress style={{ transform: [{ rotate: '90deg' }, { scaleX: -1 }] }}
    size={95}
    width={10}
    fill={100} // Percentage fill
    tintColor="#aa7b08"
    backgroundColor="#dddddd"
  >
    {
      () => (
        <Image 
          source={require('@/assets/images/Sodium Icon.png')} // Change this to your desired image
          style={{ 
            width: 40,
            height: 40,
            borderRadius: 20,
            transform: [{ rotate: '450deg' }, { scaleX: 1 }],
          }}
          resizeMode="contain"
        />
      )
    }
  </AnimatedCircularProgress>
</View>
  </View>
    </View>
      </View>

      {/* Container 3 */}
      <View style={[styles.column,]}>
        {/* Your content */}
        {<View style={styles.textRow}>
        <Text style={styles.title}>64g</Text>
        </View>}
        <View style={styles.textRow}>
        <Text style={styles.subtitle}>Protein</Text>
        </View>
        <View style={styles.textRow}> 
        <View style={styles.progressRow}>
      <View style={{ alignItems: 'flex-start', marginTop: 10}}>
  <AnimatedCircularProgress style={{ transform: [{ rotate: '90deg' }, { scaleX: -1 }] }}
    size={95}
    width={10}
    fill={100} // Percentage fill
    tintColor="#9ab106"
    backgroundColor="#dddddd"
  >
    {
      () => (
        <Image 
          source={require('@/assets/images/Protein Icon.png')} // Change this to your desired image
          style={{ 
            width: 40,
            height: 40,
            borderRadius: 20,
            transform: [{ rotate: '450deg' }, { scaleX: -1 }],
          }}
          resizeMode="contain"
        />
      )
    }
  </AnimatedCircularProgress>
</View>
  </View>
    </View>
      </View>
    </View>
    <View style={styles.paragraphContainer}>
  <Text style={styles.paragraphText}>
    The information provided by Nutrivision is for educational and informational purposes only. It is not intended as medical advice, diagnosis, or treatment. Nutrient values are estimated based on available data and may not reflect exact amounts due to variations in food composition and labeling. While we strive for accuracy, individual nutritional needs may differ. Always consult a healthcare professional or registered dietitian for personalized dietary recommendations and health-related decisions.
  </Text>
</View>
      </ThemedView>
      <TouchableOpacity style={styles.checkButton} onPress={handleCheck}>
      <Image source={require('@/assets/images/Plus.png')} 
                        style={{ width: 30, height: 30 }}/>
        </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eff1f6',
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
    color: '#9AB106',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: '#eff1f6',
    gap: 15,
    padding: 15
  },
  // Logo style from original
  logo: {
    width: 200,
    height: 60,
    resizeMode: 'contain',
    alignSelf: 'flex-start'
  },
  // New styles for page-2
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#385802',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 2,
    fontWeight: 'bold',
  },
  profileBox: {
    width: 150,
    height: 50,
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  profileBoxText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  profileText: {
    fontSize: 12,
    color: '#9AB206',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 7,
  },
  column: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    },
textRow: {
    alignItems: 'flex-start',
},
  progressRow: {
  },
  paragraphContainer: {
  backgroundColor: 'white',
  borderRadius: 8,
  padding: 15,
  marginTop: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 4,
},

paragraphText: {
  fontSize: 16,
  color: '#333',
  lineHeight: 26,
  textAlign: 'justify',
},

});