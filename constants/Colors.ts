import { Platform } from 'react-native';

// Define colors with different opacities
export const createColorWithOpacity = (hexColor: string, opacity: number): string => {
  // For web platform or when Platform is not defined, use rgba
  if (typeof Platform === 'undefined' || Platform.OS === 'web') {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // For native platforms, convert opacity to hex
  const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `${hexColor}${alpha}`;
};

// Main color palette
const tintColorLight = '#FF3050'; // Primary app color (reddish like TikTok)
const tintColorDark = '#FF4060';

export default {
  light: {
    primary: tintColorLight,
    primaryLight: '#FF6080',
    primaryDark: '#E01030',
    secondary: '#5662F6', // Purple/blue for accents
    accent: '#1EEBB4', // Teal accent
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#FFFFFF',
    card: '#F9FAFB',
    text: '#1F2937',
    secondaryText: '#6B7280',
    tertiaryText: '#9CA3AF',
    border: '#E5E7EB',
    notification: '#FF3B30',
    icon: '#6B7280',
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorLight,
  },
  dark: {
    primary: tintColorDark,
    primaryLight: '#FF6080',
    primaryDark: '#E01030',
    secondary: '#6470FF', // Purple/blue for accents
    accent: '#20FFBE', // Teal accent
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    background: '#121212',
    card: '#1E1E1E',
    text: '#F9FAFB',
    secondaryText: '#D1D5DB',
    tertiaryText: '#9CA3AF',
    border: '#374151',
    notification: '#FF453A',
    icon: '#D1D5DB',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorDark,
  },
};

// Shades of gray for neutral tones
export const gray = {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
  950: '#030712',
};

// Spacing system
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};