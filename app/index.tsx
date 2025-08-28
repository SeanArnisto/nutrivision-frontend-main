// Updated Page2.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "@/types/types";
import DisclaimerModal from "@/components/DisclaimerModal";

// Navigation prop type for this screen
type Page2ScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "page-2"
>;

const Page2: React.FC = () => {
  const navigation = useNavigation<Page2ScreenNavigationProp>();
  const [showDisclaimerModal, setShowDisclaimerModal] = useState<boolean>(false);

  const handleGetStarted = (): void => {
    setShowDisclaimerModal(true);
  };

  const handleDisclaimerAgree = (): void => {
    setShowDisclaimerModal(false);
    navigation.navigate("signup"); // TODO: confirm route
  };

  const handleDisclaimerClose = (): void => {
    setShowDisclaimerModal(false);
  };

  const handleLogin = (): void => {
    navigation.navigate("login"); // TODO: confirm route
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top: App logo */}
      <View style={styles.topContainer}>
        <Image
          source={require("@/assets/images/nutrivision_headstarted.png")}
          style={styles.logo}
        />
      </View>

      {/* Middle: Main image */}
      <View style={styles.middleContainer}>
        <Image
          source={require("@/assets/images/middlepic_started.png")}
          style={styles.mainImage}
        />
      </View>

      {/* Bottom: Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={handleGetStarted}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary} onPress={handleLogin}>
          <Text style={styles.buttonTextSecondary}>
            I already have an account
          </Text>
        </TouchableOpacity>
      </View>

      {/* Disclaimer Modal */}
      <DisclaimerModal
        visible={showDisclaimerModal}
        onClose={handleDisclaimerClose}
        onAgree={handleDisclaimerAgree}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eff1f6",
  },
  topContainer: {
    alignItems: "center",
    paddingTop: 20,
  },
  middleContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomContainer: {
    alignItems: "center",
    paddingBottom: 10,
    width: "100%",
  },
  logo: {
    width: 250,
    height: 80,
    resizeMode: "contain",
  },
  mainImage: {
    width: 400,
    height: 400,
    resizeMode: "contain",
  },
  buttonPrimary: {
    width: "90%",
    padding: 15,
    backgroundColor: "#9AB106",
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonSecondary: {
    width: "90%",
    padding: 15,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#9AB106",
    borderRadius: 8,
    alignItems: "center",
  },
  buttonTextSecondary: {
    color: "#9AB106",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Page2;