import React from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { ThemedText } from "@/components/ThemedText";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Responsive font size based on screen width
const getResponsiveFontSize = () => {
  if (SCREEN_WIDTH < 350) return 10; // Very small screens
  if (SCREEN_WIDTH < 400) return 11; // Small screens
  return 12; // Normal screens
};

type ProfileBoxProps = {
  primaryText?: string;
  highlightedText?: string;
  secondaryText?: string;
  style?: any; 
  textStyle?: any; 
  highlightStyle?: any; 
};

export default function ProfileBox({ 
  primaryText = "Average", 
  highlightedText = "Daily", 
  secondaryText = "Intake",
  style,
  textStyle,
  highlightStyle
}: ProfileBoxProps) {
  return (
    <View style={[styles.profileBox, style]}>
      <ThemedText 
        style={[styles.profileBoxText, textStyle]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {primaryText} <ThemedText style={[styles.profileText, highlightStyle]}>{highlightedText}</ThemedText>{" "}
        {secondaryText}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: 8,
  },
  profileBoxText: {
    fontSize: getResponsiveFontSize(),
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    includeFontPadding: false,
  },
  profileText: {
    fontSize: getResponsiveFontSize(),
    color: "#9AB206",
  },
});