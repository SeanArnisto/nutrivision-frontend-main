import { StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "@/types/types";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, useRoute } from "@react-navigation/native";

type Page2ScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "page-2"
>;

interface GoBackProps {
  position?: "top" | "bottom"
}

export default function GoBack({
  position="bottom" 
}: GoBackProps) {
  const navigation = useNavigation<Page2ScreenNavigationProp>();
  const handleGoBack = () => {
    navigation.goBack();
  }

  return (
    <>
      <TouchableOpacity
        style={position === "top" ? styles.roundButtonTop : styles.roundButtonBottom}
        onPress={handleGoBack}
        disabled={false}
      >
        <Ionicons name="arrow-undo-outline" size={28} color="#9AB206" />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  roundButtonBottom: {
    width: 60,
    height: 60,
    bottom: 40,
    left: 20,
    borderRadius: 30,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  roundButtonTop: {
    width: 60,
    height: 60,
    top: 40,
    left: 20,
    borderRadius: 30,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
});