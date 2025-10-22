import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'info' | 'success' | 'error' | '';

interface ToastProps {
  type: ToastType;
  title: string;
  message: string;
  visible: boolean;
  onClose?: () => void;
  autoHide?: boolean;
  duration?: number;
}

export default function Toast({
  type,
  title,
  message,
  visible,
  onClose,
  autoHide = true,
  duration = 3000,
}: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(visible);
  const [timeoutAnimation] = React.useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    setIsVisible(visible);
    
    if (visible && autoHide) {
      // Reset and start timeout animation
      timeoutAnimation.setValue(0);
      
      Animated.timing(timeoutAnimation, {
        toValue: 1,
        duration: duration,
        useNativeDriver: false,
      }).start();

      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      
      return () => {
        clearTimeout(timer);
        timeoutAnimation.setValue(0);
      };
    }
  }, [visible, autoHide, duration, onClose, timeoutAnimation]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    switch (type) {
      case 'info':
        return {
          backgroundColor: '#E3F2FD',
          borderColor: '#2196F3',
          iconColor: '#2196F3',
          iconName: 'information-circle' as const,
        };
      case 'success':
        return {
          backgroundColor: '#E8F5E8',
          borderColor: '#4CAF50',
          iconColor: '#4CAF50',
          iconName: 'checkmark-circle' as const,
        };
      case 'error':
        return {
          backgroundColor: '#FFEBEE',
          borderColor: '#F44336',
          iconColor: '#F44336',
          iconName: 'close-circle' as const,
        };
      default:
        return {
          backgroundColor: '#E3F2FD',
          borderColor: '#2196F3',
          iconColor: '#2196F3',
          iconName: 'information-circle' as const,
        };
    }
  };

  const toastStyles = getToastStyles();

  const timeoutWidth = timeoutAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  // Calculate top position based on safe area
  const topPosition = Platform.OS === 'ios' 
    ? insets.top  // iOS: safe area + more margin
    : Math.max(insets.top, 30); // Android: safe area + margin or minimum 30px

  return (
    <View 
      style={[
        styles.container,
        {
          backgroundColor: toastStyles.backgroundColor,
          borderLeftColor: toastStyles.borderColor,
          top: topPosition,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={toastStyles.iconName}
          size={24}
          color={toastStyles.iconColor}
        />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: toastStyles.iconColor }]}>
          {title}
        </Text>
        <Text style={styles.message}>{message}</Text>
      </View>

      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      )}

      {/* Timeout Progress Line */}
      {autoHide && (
        <View style={styles.timeoutContainer}>
          <Animated.View 
            style={[
              styles.timeoutLine,
              {
                backgroundColor: toastStyles.borderColor,
                width: timeoutWidth,
              }
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    // top is now calculated dynamically based on safe area
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  iconContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'AlbertSans-SemiBold',
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    fontFamily: 'AlbertSans-Regular',
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
  },
  timeoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  timeoutLine: {
    height: '100%',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
});