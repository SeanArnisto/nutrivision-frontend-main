import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  ScrollView,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  ImageBackground,
} from "react-native";
import { useFonts } from "expo-font";
import { ThemedText } from "@/components/ThemedText";
import { useNavigation } from "expo-router";
import { RootStackParamList } from "@/types/types";
import { StackNavigationProp } from "@react-navigation/stack";
import * as MediaLibrary from "expo-media-library";
import LottieView from "lottie-react-native";

export default function Loading() {
  return (
    <ImageBackground
      source={require("../assets/images/loading-page-background.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.centeredContainer}>
        <Image
          source={require("@/assets/images/loading_logo.png")}
          style={styles.logo}
        />
        <LottieView
          style={styles.loading}
          source={require("../assets/loading.json")}
          autoPlay
          loop
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20, // Add padding to bring elements closer
  },
  logo: {
    width: 300,
    height: 300,
    resizeMode: "contain",
    marginBottom: -100, // Adjust spacing between logo and Lottie animation
  },
  loading: {
    width: 150, // Adjust width for better alignment
    height: 150, // Explicit height for the animation
  },
});
