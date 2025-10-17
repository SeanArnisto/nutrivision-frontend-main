import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface AmountSelectorProps {
  amount: number;
  onIncrease: () => void;
  onDecrease: () => void;
  label?: string;
  minAmount?: number;
  maxAmount?: number;
  disabled?: boolean;
  containerStyle?: any;
}

export default function AmountSelector({
  amount,
  onIncrease,
  onDecrease,
  label = "Amount",
  minAmount = 1,
  maxAmount = 999,
  disabled = false,
  containerStyle,
}: AmountSelectorProps) {
  
  const handleDecrease = () => {
    if (!disabled && amount > minAmount) {
      onDecrease();
    }
  };

  const handleIncrease = () => {
    if (!disabled && amount < maxAmount) {
      onIncrease();
    }
  };

  const isDecreaseDisabled = disabled || amount <= minAmount;
  const isIncreaseDisabled = disabled || amount >= maxAmount;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>
      
      {/* Amount Selector */}
      <View style={[styles.selectorContainer, disabled && styles.disabledContainer]}>
        {/* Decrease Button */}
        {/* <TouchableOpacity
          style={[
            styles.button,
            styles.decreaseButton,
            isDecreaseDisabled && styles.disabledButton
          ]}
          onPress={handleDecrease}
          disabled={isDecreaseDisabled}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.buttonText,
            isDecreaseDisabled && styles.disabledButtonText
          ]}>
            −
          </Text>
        </TouchableOpacity> */}

        {/* Amount Display */}
        <View style={styles.amountContainer}>
          <Text style={[styles.amountText, disabled && styles.disabledText]}>
            {amount}
          </Text>
        </View>

        {/* Increase Button */}
        {/* <TouchableOpacity
          style={[
            styles.button,
            styles.increaseButton,
            isIncreaseDisabled && styles.disabledButton
          ]}
          onPress={handleIncrease}
          disabled={isIncreaseDisabled}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.buttonText,
            isIncreaseDisabled && styles.disabledButtonText
          ]}>
            +
          </Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 150,
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
    marginBottom: 1,
  },
  selectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  disabledContainer: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  button: {
    width: 25,
    height: 30,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  decreaseButton: {
    marginRight: 4,
  },
  increaseButton: {
    marginLeft: 5,
  },
  disabledButton: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    lineHeight: 20,
  },
  disabledButtonText: {
    color: '#ccc',
  },
  amountContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  amountText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  disabledText: {
    color: '#999',
  },
});