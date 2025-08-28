import React from "react";
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

const { width, height } = Dimensions.get("window");

// Get actual screen height accounting for status bar
const getModalHeight = () => {
  if (Platform.OS === 'android') {
    const statusBarHeight = StatusBar.currentHeight || 0;
    return (height - statusBarHeight) * 0.92; // Fixed: Changed from * 2 to * 0.92
  }
  return height * 0.85;
};

type FullTextType = 'terms' | 'disclaimer' | 'privacy' | null;

interface FullTextModalProps {
  visible: boolean;
  type: FullTextType;
  onClose: () => void;
}

interface ContentData {
  title: string;
  content: string;
}

const FullTextModal: React.FC<FullTextModalProps> = ({ visible, type, onClose }) => {
  const getContent = (): ContentData => {
    switch (type) {
      case 'terms':
        return {
          title: 'Terms and Agreement',
          content: `By using this application, you agree to the following terms:

1. Acceptance of Terms: Your use of this application constitutes acceptance of these terms and conditions.

2. Permitted Use: This application is intended for personal, non-commercial use only. You may not modify, distribute, or reverse engineer the application.

3. User Responsibilities: You are responsible for ensuring the accuracy of images captured and understand that nutritional analysis depends on image quality. You agree to use this application responsibly and in accordance with its intended purpose.

4. Intellectual Property: All content, features, and functionalities are owned by the developers and are protected by copyright and other intellectual property laws.

5. Limitation of Liability: The developers are not liable for any damages, losses, or health consequences resulting from the use of this application.

6. Modifications: These terms may be updated periodically. Continued use of the application after changes constitutes acceptance of new terms.

7. Termination: We reserve the right to terminate or restrict access to the application at any time without notice.`
        };
      case 'disclaimer':
        return {
          title: 'Disclaimer',
          content: `This application is designed for informational and educational purposes only. The nutritional analysis and recommendations provided are based on general dietary guidelines and should not be considered as professional medical advice, diagnosis, or treatment. Users with existing medical conditions, dietary restrictions, allergies, or specific health concerns should consult with qualified healthcare professionals before making any dietary changes based on the information provided by this application.

The accuracy of nutritional information extracted from product labels depends on image quality and may contain errors. Users are encouraged to verify nutritional data with original product packaging. The application assumes users do not have any medical complications and provides general recommendations that may not be suitable for individuals with specific health conditions.

The developers and associated institutions disclaim any liability for health outcomes, adverse reactions, or consequences resulting from the use of this application. Users assume full responsibility for their dietary choices and health decisions.`
        };
      case 'privacy':
        return {
          title: 'Privacy Policy',
          content: `This privacy policy explains how your information is collected, used, and protected when using this application.

Information Collection:
• Images of nutritional labels and fruits captured through the application
• Usage data and interaction patterns within the application
• Device information necessary for application functionality

Information Use:
• Process captured images to extract nutritional information
• Provide dietary recommendations and feedback
• Improve application performance and user experience
• Generate anonymized usage statistics for research purposes

Data Storage and Security:
• Images and data are processed locally on your device when possible
• Any data transmitted is encrypted and protected using industry-standard security measures
• Personal information is not shared with third parties without explicit consent

Data Retention:
• Captured images may be temporarily stored for processing purposes
• Users can delete captured images at any time through application settings
• Usage data may be retained in anonymized form for research and improvement purposes

User Rights:
• You have the right to access, modify, or delete your personal data
• You can disable certain data collection features through the application settings
• You may request information about data processing activities

Third-Party Services:
• The application may use third-party services for image processing or analytics
• These services operate under their own privacy policies

Changes to Privacy Policy:
• This policy may be updated to reflect changes in data practices
• Users will be notified of significant changes through the application
• Contact Information

For questions about privacy practices or data handling, contact the development team through the application's support feature.

By using this application, you acknowledge that you have read and understood these policies and agree to their terms.`
        };
      default:
        return { title: '', content: '' };
    }
  };

  const content: ContentData = getContent();

  return (
    <Modal
      visible={visible}
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
                <Text style={styles.modalTitle}>{content.title}</Text>
                <Text style={styles.fullText}>{content.content}</Text>
                
                <TouchableOpacity style={styles.goBackButton} onPress={onClose}>
                  <Text style={styles.goBackButtonText}>GO BACK</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    paddingBottom: Platform.OS === 'android' ? 30 : 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: Platform.OS === 'android' ? '700' : 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
    includeFontPadding: false,
  },
  fullText: {
    fontSize: 12,
    lineHeight: Platform.OS === 'android' ? 18 : 16,
    color: '#666',
    textAlign: 'justify',
    marginBottom: 30,
    includeFontPadding: false,
  },
  goBackButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#9AB106',
    paddingVertical: Platform.OS === 'android' ? 16 : 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
    minHeight: Platform.OS === 'android' ? 50 : 'auto',
  },
  goBackButtonText: {
    color: '#9AB106',
    fontSize: 16,
    fontWeight: Platform.OS === 'android' ? '700' : 'bold',
    includeFontPadding: false,
  },
});

export default FullTextModal;