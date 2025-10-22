import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';

interface GenderSelectionModalProps {
  visible: boolean;
  title: string;
  onSelect: (gender: 'male' | 'female') => void;
  onCancel: () => void;
}

const GenderSelectionModal: React.FC<GenderSelectionModalProps> = ({
  visible,
  title,
  onSelect,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.contentContainer}>
              <Text style={styles.modalTitle}>{title}</Text>
              
              <View style={styles.optionsContainer}>
                <TouchableOpacity 
                  style={styles.optionButton} 
                  onPress={() => onSelect('male')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionButtonText}>Male</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.optionButton} 
                  onPress={() => onSelect('female')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionButtonText}>Female</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>
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
    marginBottom: 24,
    color: '#333',
    includeFontPadding: false,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: '#9AB106',
    paddingVertical: Platform.OS === 'android' ? 16 : 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Platform.OS === 'android' ? 48 : 'auto',
  },
  optionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: Platform.OS === 'android' ? '700' : 'bold',
    includeFontPadding: false,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: Platform.OS === 'android' ? 14 : 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Platform.OS === 'android' ? 48 : 'auto',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: Platform.OS === 'android' ? '600' : '500',
    includeFontPadding: false,
  },
});

export default GenderSelectionModal;
