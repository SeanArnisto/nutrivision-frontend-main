import { StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "@/types/types";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation, useRoute } from "@react-navigation/native";

type Page2ScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "page-2"
>;

type GoNextProp = {
    next: keyof RootStackParamList;
}

export default function GoNext({next}: GoNextProp) {
  const navigation = useNavigation<Page2ScreenNavigationProp>();
  const handleCheck = () => {
    navigation.navigate(next);
  };

  return (
    <>
      <TouchableOpacity style={styles.checkButton} onPress={handleCheck}>
        <Ionicons name="arrow-redo-outline" size={28} color="#9AB206" />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
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
});
