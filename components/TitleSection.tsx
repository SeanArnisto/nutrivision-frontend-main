import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TitleSectionProps {
  title: string;
  description: string;
  titleStyle?: object;
  descriptionStyle?: object;
  containerStyle?: object;
}

export default function TitleSection({
  title,
  description,
  titleStyle,
  descriptionStyle,
  containerStyle,
}: TitleSectionProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      <Text style={[styles.description, descriptionStyle]}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 34,
    fontFamily: 'AlbertSans-Bold',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    fontFamily: 'AlbertSans-Regular',
  },
});