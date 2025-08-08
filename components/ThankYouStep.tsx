import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function ThankYouStep() {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/LogoWithCircle.png')}
          style={styles.circularLogo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>
          Thank you for using
        </Text>
        <Image
          source={require('@/assets/images/NutriVision.png')}
          style={styles.brandLogo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>
          Eat Smarter, Live Healthier!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 48,
    alignItems: 'center',
  },
  circularLogo: {
    width: 320,
    height: 320,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 8,
    fontFamily: 'AlbertSans-Bold', // Using Albert Sans font
  },
  brandLogo: {
    width: 200,
    height: 40,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'AlbertSans-Regular', // Using Albert Sans font
  },
});