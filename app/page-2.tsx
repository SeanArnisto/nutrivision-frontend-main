import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Image,
  Dimensions,
  SafeAreaView,
  Text,
  TouchableOpacity,
} from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import "react-circular-progressbar/dist/styles.css";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import AvgIntakeCard from "@/components/avgIntakeCard";
import { nutrients } from "@/constants/nutrientIcons";
import { strings } from "@/constants/strings";
import AppLogo from "@/components/appLogo";
import GoBack from "@/components/ReturnButton";
import GoNext from "@/components/NextButton";
import ProfileBox from "@/components/ProfileBox";
import BottomNavBar from "@/components/BottomNavBar";
import Calendar from "@/components/Calendar";
import DateDetailModal from "@/components/DateDetailModal";
import { useNutritionIntake } from "@/stores/nutritionIntakeStore";

type Page2ScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "page-2"
>;

export default function Page2() {
  const navigation = useNavigation<Page2ScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Use new nutrition intake store
  const { nutritionData, isLoading, error, fetchNutritionIntake } = useNutritionIntake();

  // Mock account creation date - replace with actual user data
  const accountCreationDate = new Date('2024-12-01'); // User created account on Dec 1, 2024

  // Mock sessions data for calendar - replace this with actual data from your store/API
  const mockSessionsData = {
    '2025-01-15': 2,
    '2025-01-22': 4, // This will show the line indicator (3+ sessions)
    '2025-01-28': 3,
    '2025-01-30': 1,
  };

  // Mock food entries for the selected date
  const getMockFoodEntries = (date: Date | null) => {
    if (!date) return [];
    
    // Mock data - replace with actual API call based on selected date
    return [
      {
        id: '1',
        image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&h=200&fit=crop',
        type: 'fruit' as const,
      },
      {
        id: '2',
        image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&h=200&fit=crop',
        type: 'fruit' as const,
      },
      {
        id: '3',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop',
        type: 'label' as const,
      },
      {
        id: '4',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop',
        type: 'label' as const,
      },
      {
        id: '5',
        image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&h=200&fit=crop',
        type: 'fruit' as const,
      },
    ];
  };

  // Mock nutrition summary for the selected date
  const getMockNutritionSummary = () => ({
    carbs: 18,
    sodium: 1.8,
    protein: 2,
    total: 100,
  });

  // Fetch nutrition data on component mount
  useEffect(() => {
    fetchNutritionIntake();
  }, []);

  const handleTabPress = (tabName: string) => {
    if (tabName === activeTab) {
      navigation.replace('page-2');
    } else {
      setActiveTab(tabName);
      switch (tabName) {
        case 'home':
          navigation.navigate('page-2');
          break;
        case 'stats':
          navigation.navigate('statistics');
          break;
        case 'settings':
          navigation.navigate('settings');
          break;
        case 'profile':
          navigation.navigate('profile');
          break;
      }
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setModalVisible(true);
    // You can add logic here to fetch data for the selected date
    console.log('Selected date:', date.toDateString());
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  // Calculate averages from nutrition data
  const carbAvg = nutritionData?.avg_carbs ? Math.round(nutritionData.avg_carbs) : 310;
  const proteinAvg = nutritionData?.avg_protein ? Math.round(nutritionData.avg_protein) : 64;
  const sodiumAvg = nutritionData?.avg_sodium ? Math.round(nutritionData.avg_sodium / 1000) : 28;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppLogo />
      <ThemedView style={styles.container}>
        <ProfileBox primaryText="Average" highlightedText="Daily" secondaryText="Intake"/>
        
        <View style={styles.rowContainer}>
          {/* Container 1 */}
          <AvgIntakeCard
            iconSource={nutrients.carbohydrate.icon}
            tintColor={nutrients.carbohydrate.tintColor}
            subtitle="Carbohydrate"
            value={isLoading ? "..." : carbAvg.toString()}
          />

          {/* Container 2 */}
          <AvgIntakeCard
            iconSource={nutrients.sodium.icon}
            tintColor={nutrients.sodium.tintColor}
            subtitle="Sodium"
            value={isLoading ? "..." : sodiumAvg.toString()}
          />

          {/* Container 3 */}
          <AvgIntakeCard
            iconSource={nutrients.protein.icon}
            tintColor={nutrients.protein.tintColor}
            subtitle="Protein"
            value={isLoading ? "..." : proteinAvg.toString()}
          />
        </View>

        {/* Error handling */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error loading nutrition data: {error}</Text>
            <TouchableOpacity onPress={fetchNutritionIntake} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Calendar Component */}
        <Calendar 
          onDateSelect={handleDateSelect}
          sessionsData={mockSessionsData}
          accountCreationDate={accountCreationDate}
        />

        {/* Date Detail Modal */}
        <DateDetailModal
          visible={modalVisible}
          onClose={handleModalClose}
          selectedDate={selectedDate}
          foodEntries={getMockFoodEntries(selectedDate)}
          nutritionSummary={getMockNutritionSummary()}
        />
      </ThemedView>

      {/* <GoBack />
      <GoNext next="camera"/> */}
      
      <BottomNavBar 
        activeTab={activeTab}
        onTabPress={handleTabPress}
        onCameraPress={() => navigation.navigate('camera')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eff1f6",
  },
  container: {
    flex: 1,
    backgroundColor: "#eff1f6",
    gap: 15,
    padding: 15,
    paddingBottom: 100,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 7,
  },
  // Add these new styles for error handling
  errorContainer: {
    backgroundColor: "#ffebee",
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  errorText: {
    fontSize: 14,
    color: "#c62828",
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});