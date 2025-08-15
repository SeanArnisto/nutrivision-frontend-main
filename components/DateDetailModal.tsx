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

interface FoodEntry {
  id: string;
  image: string;
  type: 'fruit' | 'label';
}

interface NutritionSummary {
  carbs: number;
  sodium: number;
  protein: number;
  total: number;
}

interface DateDetailModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  foodEntries: FoodEntry[];
  nutritionSummary: NutritionSummary;
}

const DateDetailModal: React.FC<DateDetailModalProps> = ({
  visible,
  onClose,
  selectedDate,
  foodEntries,
  nutritionSummary,
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
      animationType="slide"
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
            {/* Food Images Grid */}
            <View style={styles.imageGrid}>
              {foodEntries.map((entry, index) => (
                <View key={entry.id} style={[styles.imageContainer, { width: imageSize, height: imageSize }]}>
                  <Image
                    source={{ uri: entry.image }}
                    style={styles.foodImage}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </View>

            {/* Nutrition Summary */}
            <View style={styles.nutritionContainer}>
              {/* Carbs */}
              <View style={styles.nutritionItem}>
                <View style={styles.nutritionIconContainer}>
                  <View style={[styles.nutritionIcon, { backgroundColor: '#8BC34A' }]}>
                    <Text style={styles.nutritionIconText}>🌾</Text>
                  </View>
                </View>
                <Text style={styles.nutritionValue}>{nutritionSummary.carbs}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>

              {/* Sodium */}
              <View style={styles.nutritionItem}>
                <View style={styles.nutritionIconContainer}>
                  <View style={[styles.nutritionIcon, { backgroundColor: '#FF9800' }]}>
                    <Text style={styles.nutritionIconText}>🧂</Text>
                  </View>
                </View>
                <Text style={styles.nutritionValue}>{nutritionSummary.sodium}g</Text>
                <Text style={styles.nutritionLabel}>Sodium</Text>
              </View>

              {/* Protein */}
              <View style={styles.nutritionItem}>
                <View style={styles.nutritionIconContainer}>
                  <View style={[styles.nutritionIcon, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.nutritionIconText}>🥩</Text>
                  </View>
                </View>
                <Text style={styles.nutritionValue}>{nutritionSummary.protein}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
            </View>

            {/* Total Nutrient Amount */}
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Nutrient Amount:</Text>
              <Text style={styles.totalValue}>{nutritionSummary.total}g</Text>
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
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    marginBottom: 10,
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 10,
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionIconContainer: {
    marginBottom: 8,
  },
  nutritionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutritionIconText: {
    fontSize: 20,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  totalContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default DateDetailModal;