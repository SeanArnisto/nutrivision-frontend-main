import { StyleSheet, Platform, StatusBar } from "react-native";

export default StyleSheet.create({
  AndroidSafeArea: {
    flex: 1,
    backgroundColor: "#eff1f6", // Match your app's background color
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  }
});
