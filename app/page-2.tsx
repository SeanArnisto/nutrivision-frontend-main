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
import { useNutritionIntake } from "@/stores/nutritionIntakeStore";

type Page2ScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "page-2"
>;

export default function Page2() {
  const navigation = useNavigation<Page2ScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState('home');
  
  // Use new nutrition intake store
  const { nutritionData, isLoading, error, fetchNutritionIntake } = useNutritionIntake();

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

  // Calculate averages from nutrition data
  const carbAvg = nutritionData?.avg_carbs ? Math.round(nutritionData.avg_carbs) : 0;
  const proteinAvg = nutritionData?.avg_protein ? Math.round(nutritionData.avg_protein) : 0;
  const sodiumAvg = nutritionData?.avg_sodium ? Math.round(nutritionData.avg_sodium / 1000) : 0;

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
            value={isLoading ? "..." : carbAvg}
          />

          {/* Container 2 */}
          <AvgIntakeCard
            iconSource={nutrients.sodium.icon}
            tintColor={nutrients.sodium.tintColor}
            subtitle="Sodium"
            value={isLoading ? "..." : sodiumAvg}
          />

          {/* Container 3 */}
          <AvgIntakeCard
            iconSource={nutrients.protein.icon}
            tintColor={nutrients.protein.tintColor}
            subtitle="Protein"
            value={isLoading ? "..." : proteinAvg}
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

        <View style={styles.paragraphContainer}>
          <Text style={styles.paragraphText}>
            {strings.disclaimer}
          </Text>
        </View>
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
  paragraphContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  paragraphText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 26,
    textAlign: "justify",
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
