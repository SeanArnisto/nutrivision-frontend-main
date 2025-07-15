import React from "react";
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
import { useRecommStore } from "@/hooks/store";
import { Ionicons } from "@expo/vector-icons";
import AvgIntakeCard from "@/components/avgIntakeCard";
import { nutrients } from "@/constants/nutrientIcons";
import { strings } from "@/constants/strings";
import AppLogo from "@/components/appLogo";
import GoBack from "@/components/ReturnButton";
import GoNext from "@/components/NextButton";

type Page2ScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "page-2"
>;

export default function Page2() {
  
  const navigation = useNavigation<Page2ScreenNavigationProp>();
  
  const minCarb = useRecommStore((state) => state.minCarb);
  const maxCarb = useRecommStore((state) => state.maxCarb);

  const minProtein = useRecommStore((state) => state.minProtein);
  const maxProtein = useRecommStore((state) => state.maxProtein);

  const minSodium = useRecommStore((state) => state.minSodium);
  const maxSodium = useRecommStore((state) => state.maxSodium);

  const handleCheck = () => {
    navigation.navigate("camera");
  };

  const carbsMin = minCarb;
  const carbsMax = maxCarb;

  const carbAvg = Math.round((carbsMin + carbsMax) / 2);

  const proteinMin = minProtein;
  const proteinMax = maxProtein;

  const proteinAvg = Math.round((proteinMin + proteinMax) / 2);

  const sodiumMin = minSodium;
  const sodiumMax = maxSodium;

  const sodiumAvg = Math.round((sodiumMin + sodiumMax) / 2) / 1000;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppLogo />
      <ThemedView style={styles.container}>
        {/* Add your new page-2 content here */}
        <View style={styles.profileBox}>
          <ThemedText style={styles.profileBoxText}>
            Average <ThemedText style={styles.profileText}>Daily</ThemedText>{" "}
            Intake
          </ThemedText>
        </View>
        <View style={styles.rowContainer}>
          {/* Container 1 */}
          <AvgIntakeCard
            iconSource={nutrients.carbohydrate.icon}
            tintColor={nutrients.carbohydrate.tintColor}
            subtitle="Carbohydrate"
            value={carbAvg}
          />

          {/* Container 2 */}
          <AvgIntakeCard
            iconSource={nutrients.sodium.icon}
            tintColor={nutrients.sodium.tintColor}
            subtitle="Sodium"
            value={sodiumAvg}
          />

          {/* Container 3 */}
          <AvgIntakeCard
            iconSource={nutrients.protein.icon}
            tintColor={nutrients.protein.tintColor}
            subtitle="Protein"
            value={proteinAvg}
          />
        </View>
        <View style={styles.paragraphContainer}>
          <Text style={styles.paragraphText}>
            {strings.disclaimer}
          </Text>
        </View>
      </ThemedView>
      {/* navigations */}
      <GoBack />
      <GoNext next="camera"/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eff1f6",
  },
  checkButton: {
    position: "absolute",
    bottom: 40,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  checkMark: {
    fontSize: 25,
    color: "#9AB106",
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    backgroundColor: "#eff1f6",
    gap: 15,
    padding: 15,
  },
  // Logo style from original
  logo: {
    width: 200,
    height: 60,
    resizeMode: "contain",
    alignSelf: "flex-start",
  },
  // New styles for page-2
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#385802",
  },
  profileBox: {
    width: 150,
    height: 50,
    backgroundColor: "white",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  profileBoxText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  profileText: {
    fontSize: 12,
    color: "#9AB206",
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
});
