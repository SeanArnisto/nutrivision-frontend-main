export type RootStackParamList = {
  index: undefined;
  'page-6': undefined; // This corresponds to your page-6.tsx screen
  'page-2': undefined; // This corresponds to your page-2.tsx screen
  'camera' : undefined; // This corresponds to your camera.tsx screen
  'nutrient-page': undefined; // This corresponds to your 5.1 User Nutrient Page screen
  'feedback':undefined; // This corresponds to your 5.1 User Nutrient Page screen
  'loading': undefined; // This corresponds to your loading.tsx screen
  'landing_page': undefined; // This is the landing page when the user opens the app
  'onboarding': undefined;
  'settings': undefined; // Settings page
  'profile': undefined; // Profile page
  'statistics': undefined; // Statistics page
  'login': undefined;
  'signup': undefined;
  'otp': undefined;
  'photo-label-details': {
  imageUri: string;
  nutritionalData?: {
    carbs: number;
    sodium: number;
    protein: number;
    servings: number;
  };
};
  'forgot-email': undefined;
  'forgot-otp': { email: string };
  'forgot-reset': { email: string };
};
