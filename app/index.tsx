import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Switch,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import Carousel from 'react-native-reanimated-carousel';
import { RootStackParamList } from '@/types/types'; // adjust path as needed
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'index'>;

export default function HomeScreen() {
  // ======== AGE STATE ========
  const [age, setAge] = useState<number>(25);
  const [inputValue, setInputValue] = useState<string>('25');
  const [inputError, setInputError] = useState(false);

  const handleAgeChange = (text: string) => {
    setInputValue(text);
    if (/^\d+$/.test(text)) {
      const newAge = parseInt(text, 10);
      if (!isNaN(newAge)) {
        setAge(Math.max(18, newAge));
        setInputError(false);
        return;
      }
    }
    setInputError(true);
  };

  const handleIncrement = () => {
    setAge(prev => {
      const newAge = prev + 1;
      setInputValue(newAge.toString());
      return newAge;
    });
  };

  const handleDecrement = () => {
    setAge(prev => {
      const newAge = Math.max(18, prev - 1);
      setInputValue(newAge.toString());
      return newAge;
    });
  };

  // ======== WEIGHT STATE ========
  const [weightValue, setWeightValue] = useState<string>('54.2');
  const [isKg, setIsKg] = useState(true); // true => kg, false => lb
  const toggleWeightUnit = () => setIsKg(prev => !prev);

  // ======== HEIGHT STATE ========
  const [heightValue, setHeightValue] = useState<string>("5'7");
  const [isFt, setIsFt] = useState(true); // true => ft, false => cm
  const toggleHeightUnit = () => setIsFt(prev => !prev);

  // ======== GENDER STATE (NEW) ========
  const [isMale, setIsMale] = useState(true); // true: Male, false: Female

  // ======== NAVIGATION ========
  const navigation = useNavigation<HomeScreenNavigationProp>();

  // ======== CAROUSEL DATA ========
  const carouselItems = [
    {
      id: 'slide-1',
      title: '',
      text: `DISCLAIMER: Any information provided is for educational purposes only and should not be considered medical or professional advice. Always consult a qualified professional for health-related decisions.`,
    },
    {
      id: 'slide-2',
      title: '',
      text: `To optimize your experience and provide personalized recommendations, we collect your age, weight, and height. This helps us tailor our services to better suit your needs and preferences.`,
    },
    {
      id: 'slide-3',
      title: '',
      text: `Measurements may not always be 100% accurate, and slight variations can occur based on different factors. We recommend using precise measuring tools and consulting experts for the most reliable data.`,
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  const renderDetailBox = ({ item }: { item: typeof carouselItems[0] }) => {
    return (
      <View style={styles.carouselDetailBox}>
        <ThemedText style={styles.carouselText}>{item.text}</ThemedText>
      </View>
    );
  };

  // When the check button is pressed, navigate to 'Page-6'
  const handleCheck = () => {
    navigation.navigate('page-2');
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0} // Adjust as needed
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
            {/* Background/Top Image */}
            <Image
              source={require('@/assets/images/NutriVision.png')}
              style={styles.image}
              accessibilityRole="image"
              accessibilityLabel="NutriVision logo"
            />
            <ThemedView style={[styles.container, { backgroundColor: '#eff1f6' }]}>
              {/* Logo kept from original */}
              {/* ===== NEW PROFILE BOX ===== */}
              <View style={styles.profileBox}>
                <ThemedText style={styles.profileBoxText}>
                  User <ThemedText style={styles.profileText}>Profile</ThemedText> Details
                </ThemedText>
              </View>

              {/* ========== CAROUSEL (ANIMATED DETAIL BOXES) ========== */}
              <View style={styles.carouselContainer}>
                <Carousel
                  data={carouselItems}
                  renderItem={renderDetailBox}
                  width={SCREEN_WIDTH - 20}
                  height={160}
                  style={{ alignSelf: 'center', overflow: 'visible' }} 
                  onSnapToItem={index => setActiveIndex(index)}
                />

                {/* Pagination Dots */}
                <View style={styles.paginationContainer}>
                  {carouselItems.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, { backgroundColor: i === activeIndex ? '#385802' : '#ccc' }]}
                    />
                  ))}
                </View>
              </View>

              {/* =============== AGE CONTAINER =============== */}
              <View style={styles.ageContainer}>
                <View style={styles.leftColumn}>
                  <View style={styles.topLeft}>
                    <ThemedText style={styles.containerTitle}>Age</ThemedText>
                  </View>
                  <View style={styles.bottomLeft}>
                    <ThemedText style={styles.containerSubtitle}>
                      Age affects nutrient intake by changing metabolism, absorption, and dietary needs.
                    </ThemedText>
                  </View>
                </View>
                  
                {/* Right Column for Counter */}
                <View style={styles.rightColumn}>
                  <View style={styles.formContainer}>
                    <View style={styles.counterWrapper}>
                      <TouchableOpacity style={styles.counterButton} onPress={handleDecrement}>
                        <ThemedText style={styles.counterText}>{'<'}</ThemedText>
                      </TouchableOpacity>

                      <TextInput
                        style={[styles.ageInput, inputError && styles.inputError]}
                        keyboardType="numeric"
                        returnKeyType="done"
                        value={inputValue}
                        onChangeText={handleAgeChange}
                        maxLength={3}
                        onBlur={() => {
                          if (inputError || age.toString() !== inputValue) {
                            setInputValue(age.toString());
                            setInputError(false);
                          }
                        }}
                      />

                      <TouchableOpacity style={styles.counterButton} onPress={handleIncrement}>
                        <ThemedText style={styles.counterText}>{'>'}</ThemedText>
                      </TouchableOpacity>
                    </View>

                    {inputError && (
                      <ThemedText style={styles.errorText}>
                        Please enter numbers only (18-999)
                      </ThemedText>
                    )}
                  </View>
                </View>
              </View>

              {/*============ GENDER CONTAINER (UPDATED) =============== */}
              <View style={styles.ageContainer}>
                <View style={styles.leftColumn}>
                  <View style={styles.topLeft}>
                    <ThemedText style={styles.containerTitle}>Gender</ThemedText>
                  </View>
                  <View style={styles.bottomLeft}>
                    <ThemedText style={styles.containerSubtitle}>
                      Gender influences nutrition through hormonal and physiological differences.
                    </ThemedText>
                  </View>
                </View>
                
                {/* Right Column for Gender Switch */}
                {/* Right Column for Gender Switch */}
<View style={styles.rightColumn}>
  <View style={styles.formContainer}>
    <Switch
      trackColor={{ false: '#e0e0e0', true: '#e0e0e0' }}
      thumbColor={'#9AB106'}
      style={[styles.switch, { transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }]}
      value={isMale}
      onValueChange={(value) => setIsMale(value)}
    />
    <ThemedText style={{ fontSize: 14, marginTop: 8 }}>
      {isMale ? 'Male' : 'Female'}
    </ThemedText>
  </View>
</View>

              </View>

              {/* =============== WEIGHT CONTAINER =============== */}
              <View style={styles.weightContainer}>
                <View style={styles.leftColumn}>
                  <View style={styles.topLeft}>
                    <ThemedText style={styles.containerTitle}>Weight</ThemedText>
                  </View>
                  <View style={styles.bottomLeft}>
                    <ThemedText style={styles.containerSubtitle}>
                      Weight affects nutrient needs by influencing metabolism and absorption.
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.rightColumn}>
                  <View style={styles.formContainer}>
                    <TextInput
                      style={styles.weightInput}
                      keyboardType="numeric"
                      returnKeyType="done"
                      value={weightValue}
                      onChangeText={setWeightValue}
                    />

                    <View style={styles.switchRow}>
                      <ThemedText style={styles.switchLabel}>kg</ThemedText>
                      <Switch
                        trackColor={{ false: '#e0e0e0', true: '#e0e0e0' }}
                        thumbColor={'#9AB106'}
                        style={styles.switch}
                        value={!isKg}
                        onValueChange={toggleWeightUnit}
                      />
                      <ThemedText style={styles.switchLabel}>lb</ThemedText>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* =============== HEIGHT CONTAINER =============== */}
              <View style={styles.heightContainer}>
                <View style={styles.leftColumn}>
                  <View style={styles.topLeft}>
                    <ThemedText style={styles.containerTitle}>Height</ThemedText>
                  </View>
                  <View style={styles.bottomLeft}>
                    <ThemedText style={styles.containerSubtitle}>
                      Height affects nutrient needs, growth, and overall development requirements.
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.rightColumn}>
                  <View style={styles.formContainer}>
                    <TextInput
                      style={styles.weightInput}
                      keyboardType="numeric"
                      returnKeyType="done"
                      value={heightValue}
                      onChangeText={setHeightValue}
                    />

                    <View style={styles.switchRow}>
                      <ThemedText style={styles.switchLabel}>ft</ThemedText>
                      <Switch
                        trackColor={{ false: '#e0e0e0', true: '#e0e0e0' }}
                        thumbColor={'#9AB106'}
                        style={styles.switch}
                        value={!isFt}
                        onValueChange={toggleHeightUnit}
                      />
                      <ThemedText style={styles.switchLabel}>cm</ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            </ThemedView>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      
      {/* Floating check button outside the KeyboardAvoidingView */}
      <TouchableOpacity style={styles.checkButton} onPress={handleCheck}>
        <ThemedText style={styles.checkMark}>✓</ThemedText>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 10,
    padding: 10,
  },
  image: {
    width: 200,
    height: 60,
    resizeMode: 'contain',
    alignSelf: "flex-start"
  },
  carouselContainer: {
    alignItems: 'center',
  },
  carouselDetailBox: {
    backgroundColor: 'white',
    margin: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4, 
    flex: 1,
    justifyContent: 'center',
  },
  carouselText: {
    fontSize: 12,
    lineHeight: 22,
    color: '#333',
    textAlign: 'left',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
    marginTop: 8,
  },
  ageContainer: {
    width: SCREEN_WIDTH - 20,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    height: 100,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  weightContainer: {
    width: SCREEN_WIDTH - 20,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    height: 100,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  heightContainer: {
    width: SCREEN_WIDTH - 20,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    height: 100,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  leftColumn: {
    flex: 2,
    paddingRight: 10,
  },
  topLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomLeft: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  rightColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#385802',
    textAlign: 'left',
  },
  containerSubtitle: {
    fontSize: 10,
    lineHeight: 16,
    color: '#666',
  },
  counterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterButton: {
    paddingHorizontal: 6,
  },
  counterText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ageInput: {
    height: 36,
    width: 60,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 15,
    padding: 6,
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
    backgroundColor: '#eaeaea',
  },
  inputError: {
    borderColor: '#ff4444',
    backgroundColor: '#fff0f0',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#ff4444',
  },
  weightInput: {
    height: 36,
    width: 60,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 15,
    padding: 6,
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
    backgroundColor: '#eaeaea',
  },
  switchRow: {
    width: '20%',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  switch: {
    transform: [{ scaleX: 0.6 }, { scaleY: 0.6 }],
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
});