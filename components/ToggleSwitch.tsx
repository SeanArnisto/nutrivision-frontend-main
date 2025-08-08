import React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  activeColor?: string;
  inactiveColor?: string;
  style?: object;
}

export default function ToggleSwitch({
  value,
  onValueChange,
  activeColor = '#9AB106',
  inactiveColor = '#ccc',
  style,
}: ToggleSwitchProps) {
  const animatedValue = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  const handlePress = () => {
    onValueChange(!value);
  };

  const interpolatedBackgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [inactiveColor, activeColor],
  });

  const interpolatedTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  return (
    <TouchableOpacity onPress={handlePress} style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.track,
          { backgroundColor: interpolatedBackgroundColor },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            { transform: [{ translateX: interpolatedTranslateX }] },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  track: {
    width: 50,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});
