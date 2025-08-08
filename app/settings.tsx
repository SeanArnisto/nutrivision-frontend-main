import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/types';
import AppLogo from '@/components/appLogo';
import BottomNavBar from '@/components/BottomNavBar';
import SettingsSection from '@/components/SettingsSection';
import SettingsItem from '@/components/SettingsItem';
import ToggleSwitch from '@/components/ToggleSwitch';
type SettingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'settings'
>;

export default function Settings() {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleTabPress = (tabName: string) => {
    switch (tabName) {
      case 'home':
        navigation.navigate('page-2');
        break;
      case 'stats':
        navigation.navigate('statistics');
        break;
      case 'settings':
        // Already on settings page
        break;
      case 'profile':
        navigation.navigate('profile');
        break;
    }
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change functionality not implemented yet.');
  };

  const handleAppVersion = () => {
    Alert.alert('App Version', 'NutriVision v1.0.0');
  };

  const handleContactSupport = () => {
    Alert.alert('Contact Support', 'Support contact functionality not implemented yet.');
  };

  const handleTermsAndConditions = () => {
    Alert.alert('Terms and Conditions', 'Terms and conditions page not implemented yet.');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy page not implemented yet.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppLogo />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <SettingsSection title="Privacy and Security">
          <SettingsItem
            title="Change Password"
            onPress={handleChangePassword}
          />
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsItem
            title="Notifications"
            showChevron={false}
            rightComponent={
              <ToggleSwitch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            }
          />
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingsItem
            title="App Version"
            onPress={handleAppVersion}
          />
          <SettingsItem
            title="Contact Support"
            onPress={handleContactSupport}
          />
        </SettingsSection>

        <SettingsSection title="Legal">
          <SettingsItem
            title="Terms and Conditions"
            onPress={handleTermsAndConditions}
          />
          <SettingsItem
            title="Privacy Policy"
            onPress={handlePrivacyPolicy}
            style={styles.lastItem}
          />
        </SettingsSection>
      </ScrollView>

      <BottomNavBar 
        activeTab="settings" 
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
  lastItem: {
    borderBottomWidth: 0,
  },
});
