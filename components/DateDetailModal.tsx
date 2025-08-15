import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';

interface Session {
  id: string;
  name: string;
  time?: string;
  foodCount: number;
  previewImage?: string;
}

interface DateDetailModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  sessions: Session[];
  onSessionSelect: (session: Session) => void;
}

const DateDetailModal: React.FC<DateDetailModalProps> = ({
  visible,
  onClose,
  selectedDate,
  sessions,
  onSessionSelect,
}) => {
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const { width } = Dimensions.get('window');
  const imageSize = (width - 80) / 3; // 3 images per row with margins

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {formatDate(selectedDate)}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Sessions List */}
            <View style={styles.sessionsContainer}>
              {sessions.length === 0 ? (
                <View style={styles.noSessionsContainer}>
                  <Text style={styles.noSessionsText}>No sessions recorded for this date</Text>
                </View>
              ) : (
                sessions.map((session, index) => (
                  <TouchableOpacity
                    key={session.id}
                    style={styles.sessionItem}
                    onPress={() => onSessionSelect(session)}
                  >
                    <View style={styles.sessionContent}>
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionName}>
                          {session.time}
                        </Text>
                        <Text style={styles.sessionFoodCount}>
                          {session.foodCount} item{session.foodCount !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      
                      {session.previewImage && (
                        <View style={styles.sessionPreview}>
                          <Image
                            source={{ uri: session.previewImage }}
                            style={styles.previewImage}
                            resizeMode="cover"
                          />
                        </View>
                      )}
                      
                      <View style={styles.chevronContainer}>
                        <Text style={styles.chevron}>›</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>
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
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  sessionsContainer: {
    gap: 12,
  },
  noSessionsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noSessionsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  sessionItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sessionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sessionFoodCount: {
    fontSize: 12,
    color: '#666',
  },
  sessionPreview: {
    marginRight: 12,
  },
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
});

export default DateDetailModal;