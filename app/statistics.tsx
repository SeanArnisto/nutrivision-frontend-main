import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/types';
import AppLogo from '@/components/appLogo';
import BottomNavBar from '@/components/BottomNavBar';
import NutrientSummary from '@/components/NutrientSummary';
import DailyIntakeChart from '@/components/DailyIntakeChart';
type StatisticsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'statistics'
>;

export default function Statistics() {
  const navigation = useNavigation<StatisticsScreenNavigationProp>();

  const handleTabPress = (tabName: string) => {
    switch (tabName) {
      case 'home':
        navigation.navigate('page-2');
        break;
      case 'stats':
        // Already on statistics page
        break;
      case 'settings':
        navigation.navigate('settings');
        break;
      case 'profile':
        navigation.navigate('profile');
        break;
    }
  };

  // Sample data - replace with actual data from your store/API
  const nutrientData = {
    carbs: { current: 34, target: 310 },
    sodium: { current: 2, target: 28 },
    protein: { current: 30, target: 64 },
  };

  const weeklyData = [
    { day: 'Jan 1', userInput: 94, averageIntake: 100, date: 'January 1, 2025' },
    { day: 'Jan 2', userInput: 89, averageIntake: 100, date: 'January 2, 2025' },
    { day: 'Jan 3', userInput: 97, averageIntake: 100, date: 'January 3, 2025' },
    { day: 'Jan 4', userInput: 97, averageIntake: 100, date: 'January 4, 2025' },
    { day: 'Jan 5', userInput: 90, averageIntake: 100, date: 'January 5, 2025' },
    { day: 'Jan 6', userInput: 100, averageIntake: 100, date: 'January 6, 2025' },
    { day: 'Jan 7', userInput: 102, averageIntake: 100, date: 'January 7, 2025' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppLogo />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistics</Text>
      </View>

      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Nutrient Summary Component */}
        <NutrientSummary
          carbs={nutrientData.carbs}
          sodium={nutrientData.sodium}
          protein={nutrientData.protein}
        />

        {/* Daily Intake Chart Component */}
        <DailyIntakeChart data={weeklyData} />
      </ScrollView>

      <BottomNavBar 
        activeTab="stats" 
        onTabPress={handleTabPress}
        onCameraPress={() => navigation.navigate('camera')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'AlbertSans-Bold',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 20,
    paddingBottom: 120, // Extra space for bottom navigation
  },
});
