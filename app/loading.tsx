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
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Image
            source={require("../assets/images/nutri-logo.png")}
            style={{ width: 200, height: 200 }}
            />
            <LottieView style={styles.loading} source={require('../assets/loading.json')} autoPlay loop />
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
  loading: {
    flex: 1,
    justifyContent: "center",
    width: 100,
    height: 100,
  }
});
