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
import ResponsiveNutritionCard from '@/components/ResponsiveNutritionCard';
import { nutrients } from '@/constants/nutrientIcons';

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

interface Session {
  id: string;
  name: string;
  time?: string;
  foodCount: number;
  previewImage?: string;
}

interface SessionDetailModalProps {
  visible: boolean;
  onClose: () => void;
  session: Session | null;
  foodEntries: FoodEntry[];
  nutritionSummary: NutritionSummary;
}

const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  visible,
  onClose,
  session,
  foodEntries,
  nutritionSummary,
}) => {
  const { width } = Dimensions.get('window');
  const modalWidth = width * 0.9;
  const containerWidth = modalWidth - 40; // Minus padding
  const imageSize = (containerWidth - 16) / 3; // 3 images per row with proper spacing
  const nutritionCardWidth = (containerWidth - 8) / 3; // 3 nutrition cards with gap

  // Function to render images with proper centering for odd numbers
  const renderImages = () => {
    const images = [];
    for (let i = 0; i < foodEntries.length; i++) {
      const entry = foodEntries[i];
      const isLastRowOdd = foodEntries.length % 3 !== 0 && i >= Math.floor(foodEntries.length / 3) * 3;
      const isInLastRow = i >= Math.floor(foodEntries.length / 3) * 3;
      const remainingInLastRow = foodEntries.length % 3;
      
      images.push(
        <View 
          key={entry.id} 
          style={[
            styles.imageContainer, 
            { width: imageSize, height: imageSize },
            isInLastRow && remainingInLastRow === 1 && i === foodEntries.length - 1 && styles.centeredImage
          ]}
        >
          <Image
            source={{ uri: entry.image }}
            style={styles.foodImage}
            resizeMode="cover"
          />
        </View>
      );
    }
    return images;
  };

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
            <View style={styles.headerInfo}>
              <Text style={styles.modalTitle}>
                {session?.time || 'Session Details'}
              </Text>
              {session && (
                <Text style={styles.itemCount}>
                  {foodEntries.length} item{foodEntries.length !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Food Images Grid */}
            <View style={styles.imageGrid}>
              {renderImages()}
            </View>

            {/* Nutrition Summary using ResponsiveNutritionCard */}
            <View style={styles.nutritionContainer}>
              <ResponsiveNutritionCard
                iconSource={nutrients.carbohydrate.icon}
                tintColor={nutrients.carbohydrate.tintColor}
                subtitle="Carbs"
                value={nutritionSummary.carbs}
                fill={100}
                containerWidth={nutritionCardWidth}
              />
              
              <ResponsiveNutritionCard
                iconSource={nutrients.sodium.icon}
                tintColor={nutrients.sodium.tintColor}
                subtitle="Sodium"
                value={nutritionSummary.sodium}
                fill={100}
                containerWidth={nutritionCardWidth}
              />
              
              <ResponsiveNutritionCard
                iconSource={nutrients.protein.icon}
                tintColor={nutrients.protein.tintColor}
                subtitle="Protein"
                value={nutritionSummary.protein}
                fill={100}
                containerWidth={nutritionCardWidth}
              />
            </View>

            {/* Total Nutrient Amount */}
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Total Nutrient Amount: {nutritionSummary.total}g</Text>
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
  headerInfo: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
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
    justifyContent: 'flex-start',
    marginBottom: 20,
    gap: 8,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  centeredImage: {
    alignSelf: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  nutritionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 4,
    paddingHorizontal: 2,
  },
  totalContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default SessionDetailModal;