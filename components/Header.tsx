import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface HeaderProps {
  currentStep?: number;
  totalSteps?: number;
  showBackButton?: boolean;
  onBackPress?: () => void;
  showLogo?: boolean;
  progressAnimation?: Animated.Value;
}

export default function Header({
  currentStep = 1,
  totalSteps = 4,
  showBackButton = true,
  onBackPress,
  showLogo = true,
  progressAnimation,
}: HeaderProps) {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {showBackButton && (
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )}

        {showLogo && (
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/nutrivision_headstarted.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        )}
      </View>

      {totalSteps > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            {progressAnimation ? (
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { 
                    width: progressAnimation.interpolate({
                      inputRange: [1, totalSteps],
                      outputRange: ['25%', '100%'],
                      extrapolate: 'clamp',
                    })
                  }
                ]} 
              />
            ) : (
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(currentStep / totalSteps) * 100}%` }
                ]} 
              />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    marginLeft: -40, // Compensate for back button to center logo
  },
  logo: {
    width: 180,
    height: 50,
    resizeMode: 'contain',
  },
  progressContainer: {
    paddingHorizontal: 0,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9AB106',
    borderRadius: 2,
  },
});