import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import FullTextModal from "./FullTextModal";

const { width, height } = Dimensions.get("window");

// Get actual screen height accounting for status bar
const getModalHeight = () => {
  if (Platform.OS === 'android') {
    const statusBarHeight = StatusBar.currentHeight || 0;
    return (height - statusBarHeight) * 0.9;
  }
  return height * 0.85;
};

interface DisclaimerModalProps {
  visible: boolean;
  onClose: () => void;
  onAgree: () => void;
}

interface CheckboxState {
  terms: boolean;
  privacy: boolean;
  disclaimer: boolean;
}

type FullTextType = 'terms' | 'disclaimer' | 'privacy' | null;

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ visible, onClose, onAgree }) => {
  const [showFullText, setShowFullText] = useState<FullTextType>(null);
  const [checkboxes, setCheckboxes] = useState<CheckboxState>({
    terms: false,
    privacy: false,
    disclaimer: false,
  });

  const handleCheckboxToggle = (type: keyof CheckboxState): void => {
    setCheckboxes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const isAllChecked: boolean = Object.values(checkboxes).every(checked => checked);

  const handleAgree = (): void => {
    if (isAllChecked) {
      onAgree();
      // Reset state when closing
      setCheckboxes({
        terms: false,
        privacy: false,
        disclaimer: false,
      });
    }
  };

  const handleViewFull = (type: Exclude<FullTextType, null>): void => {
    setShowFullText(type);
  };

  const handleCloseFullText = (): void => {
    setShowFullText(null);
  };

  return (
    <>
      <Modal
        visible={visible && !showFullText}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
        statusBarTranslucent={Platform.OS === 'android'}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <SafeAreaView style={styles.safeArea}>
              <ScrollView 
                style={styles.scrollContent} 
                showsVerticalScrollIndicator={true}
              >
                <View style={styles.contentContainer}>
                  {/* Terms and Agreement Section */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Terms and Agreement</Text>
                    <Text style={styles.sectionContent}>
                      By using this application, you agree to the following terms:
                      {"\n\n"}1. Acceptance of Terms: Your use of this application constitutes acceptance of these terms and conditions.
                      {"\n\n"}2. Permitted Use: This application is intended for personal, non-commercial use only. You may not modify, distribute, or reverse engineer the application.
                      {"\n\n"}3. User Responsibilities: You are responsible for ensuring the accuracy of images captured and understand that nutritional analysis depends on image quality. You agree to use this application responsibly and in accordance with its intended purpose.
                      {"\n\n"}4. Intellectual Property: All content, features, and functionalities are owned by the developers and are protected by copyright and other intellectual property laws.
                      {"\n\n"}5. Limitation of Liability: The developers are not liable for any damages, losses, or health consequences resulting from the use of this application.
                      {"\n\n"}6. Modifications: These terms may be updated periodically. Continued use of the application after changes constitutes acceptance of new terms.
                      {"\n\n"}7. Termination: We reserve the right to terminate or restrict access to the application at any time without notice.
                    </Text>
                    <TouchableOpacity onPress={() => handleViewFull('terms')}>
                      <Text style={styles.viewFullText}>View Full Terms and Agreement</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Disclaimer Section */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Disclaimer</Text>
                    <Text style={styles.sectionContent}>
                      This application is designed for informational and educational purposes only. The nutritional analysis and recommendations provided are based on general dietary guidelines and should not be considered as professional medical advice, diagnosis, or treatment. Users with existing medical conditions, dietary restrictions, allergies, or specific health concerns should consult with qualified healthcare professionals before making any dietary changes based on the information provided. The accuracy of nutritional information extracted from product labels depends on image quality and may contain errors.
                    </Text>
                    <TouchableOpacity onPress={() => handleViewFull('disclaimer')}>
                      <Text style={styles.viewFullText}>View Full Disclaimer</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Privacy Policy Section */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Privacy Policy</Text>
                    <Text style={styles.sectionContent}>
                      This application collects images of nutritional labels and fruits, along with usage data and user interactions necessary for functionality, to process nutritional information and provide dietary recommendations. Data is processed locally when possible, with industry-standard security measures, and personal information is not shared with third parties without explicit consent. Users have the right to access, modify, or delete their personal data and can disable certain data collection features through application settings, with captured images available for deletion at any time.
                    </Text>
                    <TouchableOpacity onPress={() => handleViewFull('privacy')}>
                      <Text style={styles.viewFullText}>View Full Privacy Policy</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Checkboxes */}
                  <View style={styles.checkboxContainer}>
                    <TouchableOpacity 
                      style={styles.checkboxRow} 
                      onPress={() => handleCheckboxToggle('terms')}
                    >
                      <View style={[styles.checkbox, checkboxes.terms && styles.checkboxChecked]}>
                        {checkboxes.terms && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <View style={styles.checkboxTextContainer}>
                        <Text style={styles.checkboxText}>
                          I understand and agree to the{' '}
                          <Text 
                            style={styles.clickableText}
                            onPress={() => handleViewFull('terms')}
                          >
                            Terms and Conditions
                          </Text>
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.checkboxRow} 
                      onPress={() => handleCheckboxToggle('privacy')}
                    >
                      <View style={[styles.checkbox, checkboxes.privacy && styles.checkboxChecked]}>
                        {checkboxes.privacy && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <View style={styles.checkboxTextContainer}>
                        <Text style={styles.checkboxText}>
                          I understand and agree to the{' '}
                          <Text 
                            style={styles.clickableText}
                            onPress={() => handleViewFull('privacy')}
                          >
                            Privacy Policy
                          </Text>
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.checkboxRow} 
                      onPress={() => handleCheckboxToggle('disclaimer')}
                    >
                      <View style={[styles.checkbox, checkboxes.disclaimer && styles.checkboxChecked]}>
                        {checkboxes.disclaimer && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <View style={styles.checkboxTextContainer}>
                        <Text style={styles.checkboxText}>
                          I read and understand the{' '}
                          <Text 
                            style={styles.clickableText}
                            onPress={() => handleViewFull('disclaimer')}
                          >
                            Disclaimer
                          </Text>
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Agree Button */}
                  <TouchableOpacity 
                    style={[styles.agreeButton, !isAllChecked && styles.agreeButtonDisabled]}
                    onPress={handleAgree}
                    disabled={!isAllChecked}
                  >
                    <Text style={[styles.agreeButtonText, !isAllChecked && styles.agreeButtonTextDisabled]}>
                      I AGREE
                    </Text>
                  </TouchableOpacity>

                  {/* Go Back Button */}
                  <TouchableOpacity 
                    style={styles.goBackButton}
                    onPress={onClose}
                  >
                    <Text style={styles.goBackButtonText}>
                      GO BACK
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </Modal>

      {/* Full Text Modal */}
      <FullTextModal 
        visible={showFullText !== null}
        type={showFullText}
        onClose={handleCloseFullText}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'android' ? 10 : 0,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  modalContainer: {
    width: Platform.OS === 'android' ? '100%' : width * 0.95,
    height: getModalHeight(),
    maxWidth: width * 0.95,
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 5,
        marginHorizontal: 10,
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
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 15 : 20,
    paddingBottom: Platform.OS === 'android' ? 35 : 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: Platform.OS === 'android' ? 17 : 16,
    fontWeight: Platform.OS === 'android' ? '700' : 'bold',
    marginBottom: Platform.OS === 'android' ? 12 : 10,
    color: '#333',
    includeFontPadding: false,
    letterSpacing: Platform.OS === 'android' ? 0.3 : 0,
  },
  sectionContent: {
    fontSize: Platform.OS === 'android' ? 13 : 12,
    lineHeight: Platform.OS === 'android' ? 20 : 16,
    color: Platform.OS === 'android' ? '#555' : '#666',
    marginBottom: 10,
    textAlign: 'justify',
    includeFontPadding: false,
    letterSpacing: Platform.OS === 'android' ? 0.2 : 0,
  },
  viewFullText: {
    color: '#007AFF',
    fontSize: Platform.OS === 'android' ? 13 : 12,
    textDecorationLine: 'underline',
    includeFontPadding: false,
    letterSpacing: Platform.OS === 'android' ? 0.2 : 0,
  },
  checkboxContainer: {
    marginTop: Platform.OS === 'android' ? 35 : 30,
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Platform.OS === 'android' ? 18 : 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 3,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 0 : 2,
  },
  checkboxChecked: {
    backgroundColor: '#9AB106',
    borderColor: '#9AB106',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: Platform.OS === 'android' ? '700' : 'bold',
    includeFontPadding: false,
  },
  checkboxText: {
    fontSize: Platform.OS === 'android' ? 13 : 12,
    color: Platform.OS === 'android' ? '#555' : '#333',
    flex: 1,
    lineHeight: Platform.OS === 'android' ? 20 : 16,
    includeFontPadding: false,
    letterSpacing: Platform.OS === 'android' ? 0.2 : 0,
  },
  checkboxTextContainer: {
    flex: 1,
  },
  clickableText: {
    fontSize: Platform.OS === 'android' ? 13 : 12,
    color: '#007AFF',
    textDecorationLine: 'underline',
    lineHeight: Platform.OS === 'android' ? 20 : 16,
    includeFontPadding: false,
    letterSpacing: Platform.OS === 'android' ? 0.2 : 0,
  },
  agreeButton: {
    backgroundColor: '#9AB106',
    paddingVertical: Platform.OS === 'android' ? 16 : 15,
    paddingHorizontal: Platform.OS === 'android' ? 20 : 0,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 15 : 10,
    minHeight: Platform.OS === 'android' ? 52 : 'auto',
  },
  agreeButtonDisabled: {
    backgroundColor: '#ddd',
  },
  agreeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: Platform.OS === 'android' ? '700' : 'bold',
    includeFontPadding: false,
    letterSpacing: Platform.OS === 'android' ? 0.5 : 0,
  },
  agreeButtonTextDisabled: {
    color: '#999',
  },
  goBackButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#9AB106',
    paddingVertical: Platform.OS === 'android' ? 16 : 15,
    paddingHorizontal: Platform.OS === 'android' ? 20 : 0,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: Platform.OS === 'android' ? 25 : 20,
    minHeight: Platform.OS === 'android' ? 52 : 'auto',
  },
  goBackButtonText: {
    color: '#9AB106',
    fontSize: 16,
    fontWeight: Platform.OS === 'android' ? '700' : 'bold',
    includeFontPadding: false,
    letterSpacing: Platform.OS === 'android' ? 0.5 : 0,
  },
});

export default DisclaimerModal;