// Component Types for NutriVision App

export type ToastType = 'info' | 'success' | 'error';

export interface ToastProps {
  type: ToastType;
  title: string;
  message: string;
  visible: boolean;
  onClose?: () => void;
  autoHide?: boolean;
  duration?: number;
}

export interface HeaderProps {
  currentStep?: number;
  totalSteps?: number;
  showBackButton?: boolean;
  onBackPress?: () => void;
  showLogo?: boolean;
}

export interface ScreenContainerProps {
  children: React.ReactNode;
  backgroundColor?: string;
  showHeader?: boolean;
  headerProps?: HeaderProps;
}

export interface TitleSectionProps {
  title: string;
  description: string;
  titleStyle?: object;
  descriptionStyle?: object;
  containerStyle?: object;
}

export interface SelectionButtonProps {
  title: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: object;
  textStyle?: object;
}

export interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: object;
  textStyle?: object;
  variant?: 'primary' | 'secondary';
}

export interface InfoCardProps {
  title: string;
  subtitle?: string;
  value?: string;
  editable?: boolean;
  onEdit?: () => void;
  style?: object;
  backgroundColor?: string;
}

export interface HeightInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  onValidationChange?: (isValid: boolean, errorMessage?: string) => void;
}

// Screen State Types
export interface GenderScreenState {
  selectedGender: 'male' | 'female' | null;
}

export interface HeightScreenState {
  height: string;
  isValid: boolean;
  toast: {
    visible: boolean;
    type: ToastType;
    title: string;
    message: string;
  };
}

// Navigation Types (extend your existing RootStackParamList)
export type OnboardingStackParamList = {
  'gender-screen': undefined;
  'height-screen': undefined;
  'weight-screen': undefined;
  'activity-screen': undefined;
  'thank-you': undefined;
};

// Form Validation Types
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface FormData {
  gender?: 'male' | 'female';
  height?: number;
  weight?: number;
  activityLevel?: string;
}

// Toast Configuration
export interface ToastConfig {
  info: {
    backgroundColor: string;
    borderColor: string;
    iconColor: string;
    iconName: string;
  };
  success: {
    backgroundColor: string;
    borderColor: string;
    iconColor: string;
    iconName: string;
  };
  error: {
    backgroundColor: string;
    borderColor: string;
    iconColor: string;
    iconName: string;
  };
}