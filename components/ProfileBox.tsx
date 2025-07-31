import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";

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
      <ThemedText style={[styles.profileBoxText, textStyle]}>
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
});