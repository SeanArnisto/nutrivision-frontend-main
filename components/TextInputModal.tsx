import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface TextInputModalProps {
  visible: boolean;
  title: string;
  placeholder: string;
  initialValue?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

const TextInputModal: React.FC<TextInputModalProps> = ({
  visible,
  title,
  placeholder,
  initialValue = '',
  keyboardType = 'default',
  onSubmit,
  onCancel,
}) => {
  const [inputValue, setInputValue] = useState(initialValue);

  useEffect(() => {
    if (visible) {
      setInputValue(initialValue);
    }
  }, [visible, initialValue]);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  const handleCancel = () => {
    setInputValue('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleCancel}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.contentContainer}>
              <Text style={styles.modalTitle}>{title}</Text>
              
              <TextInput
                style={styles.textInput}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder={placeholder}
                placeholderTextColor="#999"
                keyboardType={keyboardType}
                autoFocus={true}
                selectTextOnFocus={true}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]} 
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.submitButton]} 
                  onPress={handleSubmit}
                  activeOpacity={0.7}
                >
                  <Text style={styles.submitButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 5,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
  safeArea: {
    flex: 0,
  },
  contentContainer: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'android' ? '700' : 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
    includeFontPadding: false,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 12 : 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    marginBottom: 24,
    minHeight: Platform.OS === 'android' ? 48 : 'auto',
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
    }),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: Platform.OS === 'android' ? 14 : 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Platform.OS === 'android' ? 48 : 'auto',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  submitButton: {
    backgroundColor: '#9AB106',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: Platform.OS === 'android' ? '600' : '500',
    includeFontPadding: false,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: Platform.OS === 'android' ? '700' : 'bold',
    includeFontPadding: false,
  },
});

export default TextInputModal;
