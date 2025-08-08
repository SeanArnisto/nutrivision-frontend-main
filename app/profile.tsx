import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/types';
import { Ionicons } from '@expo/vector-icons';
import AppLogo from '@/components/appLogo';
import BottomNavBar from '@/components/BottomNavBar';
import ProfileField from '@/components/ProfileField';
type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'profile'
>;

export default function Profile() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const handleTabPress = (tabName: string) => {
    switch (tabName) {
      case 'home':
        navigation.navigate('page-2');
        break;
      case 'stats':
        navigation.navigate('statistics');
        break;
      case 'settings':
        navigation.navigate('settings');
        break;
      case 'profile':
        // Already on profile page
        break;
    }
  };

  const handleEditName = () => {
    Alert.alert('Edit Name', 'Name editing functionality not implemented yet.');
  };

  const handleEditAge = () => {
    Alert.alert('Edit Age', 'Age editing functionality not implemented yet.');
  };

  const handleEditWeight = () => {
    Alert.alert('Edit Weight', 'Weight editing functionality not implemented yet.');
  };

  const handleEditHeight = () => {
    Alert.alert('Edit Height', 'Height editing functionality not implemented yet.');
  };

  const handleEditGender = () => {
    Alert.alert('Edit Gender', 'Gender editing functionality not implemented yet.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppLogo />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Personal Profile</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={60} color="#333" />
          </View>
        </View>

        {/* Profile Fields Section */}
        <View style={styles.fieldsContainer}>
          <ProfileField
            label="Name"
            value="Christlei Daniel Aguila"
            onPress={handleEditName}
          />
          
          <ProfileField
            label="Age"
            value="34"
            onPress={handleEditAge}
          />
          
          <ProfileField
            label="Weight"
            value="89 kilograms"
            onPress={handleEditWeight}
          />
          
          <ProfileField
            label="Height"
            value="177 centimeters"
            onPress={handleEditHeight}
          />
          
          <ProfileField
            label="Gender"
            value="Male"
            onPress={handleEditGender}
            style={styles.lastField}
          />
        </View>
      </ScrollView>

      <BottomNavBar 
        activeTab="profile" 
        onTabPress={handleTabPress}
        onCameraPress={() => navigation.navigate('camera')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'AlbertSans-Bold',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  container: {
    flex: 1,
    paddingTop: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fieldsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
    marginBottom: 120, // Extra space for bottom nav
  },
  lastField: {
    borderBottomWidth: 0,
  },
});
