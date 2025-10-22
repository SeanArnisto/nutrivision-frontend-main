import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as Linking from "expo-linking";
import index from "@/app/index"; // adjust the path if needed
import Page6 from "@/app/page-6"; // adjust the path if needed
import Page2 from "@/app/page-2";
import { RootStackParamList } from "@/types/types"; // adjust the path if needed
import UserNutrientPage from "@/app/nutrient-page";
import Camera from "@/app/camera";
import Feedback from "@/app/feedback";
import Loading from "@/app/loading";
import LandingPage from "@/app/landing_page";
import onboarding from "@/app/onboarding";
import Settings from "@/app/settings";
import Profile from "@/app/profile";
import Statistics from "@/app/statistics";
import LoginScreen from "@/app/login";
import SignUpScreen from "@/app/signup";
import OtpScreen from "@/app/otp";
import ForgotEmailScreen from "@/app/forgot-email";
import ForgotOtpScreen from "@/app/forgot-otp";
import ForgotResetScreen from "@/app/forgot-reset";
import NutritionalLabelScreen from "@/app/photo-label-details";
import FruitDetailsScreen from '@/app/photo-fruit-details';
import { navigationRef } from "./navigationRef";

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  useEffect(() => {
    // Handle initial URL when app launches
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        console.log('Initial URL:', initialUrl);
        // OAuth callback URLs are handled by expo-web-browser automatically
        // This is just for logging and debugging purposes
      }
    };

    // Handle URL when app is already open
    const handleUrlChange = (url: string) => {
      console.log('🔗 URL changed:', url);
      
      // Check if this is an OAuth callback
      if (url.includes('login-callback')) {
        console.log('🔄 OAuth callback detected, letting expo-web-browser handle it');
        // Don't navigate - let expo-web-browser handle OAuth callbacks
        return;
      }
      
      // For other URLs, let normal navigation handle them
      console.log('📱 Normal deep link, allowing navigation');
    };

    handleInitialURL();

    // Listen for URL changes
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrlChange(url);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const linking = {
    prefixes: ['com.jamescarillo.nutrivision://'],
    config: {
      screens: {
        // OAuth callbacks should not be handled by React Navigation
        // They are automatically handled by expo-web-browser
        login: 'login',
        signup: 'signup',
        'page-2': 'page-2',
        onboarding: 'onboarding',
        index: '',
      },
    },
  };

  return (
     <NavigationContainer ref={navigationRef} linking={linking}>
        <Stack.Navigator initialRouteName="index">
          <Stack.Screen name="index" component={index} />
          <Stack.Screen name="page-6" component={Page6} />
          <Stack.Screen name="page-2" component={Page2} />
          <Stack.Screen name="nutrient-page" component={UserNutrientPage} />
          <Stack.Screen name="camera" component={Camera} />
          <Stack.Screen name="feedback" component={Feedback} />
          <Stack.Screen name="loading" component={Loading} />
          <Stack.Screen name="landing_page" component={LandingPage} />
          <Stack.Screen name="onboarding" component={onboarding} />
          <Stack.Screen name="settings" component={Settings} />
          <Stack.Screen name="profile" component={Profile} />
          <Stack.Screen name="statistics" component={Statistics} />
          <Stack.Screen name="login" component={LoginScreen} />
          <Stack.Screen name="signup" component={SignUpScreen} />
          <Stack.Screen name="otp" component={OtpScreen} />
          <Stack.Screen name="forgot-email" component={ForgotEmailScreen} />
          <Stack.Screen name="forgot-otp" component={ForgotOtpScreen} />
          <Stack.Screen name="forgot-reset" component={ForgotResetScreen} />
          <Stack.Screen name="photo-label-details" component={NutritionalLabelScreen} />
          <Stack.Screen name="photo-fruit-details" component={FruitDetailsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
  );
}
