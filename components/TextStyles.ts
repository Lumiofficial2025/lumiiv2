import { StyleSheet } from 'react-native';

export const textStyles = StyleSheet.create({
  // Headings
  h1: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  h3: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: -0.25,
  },
  h4: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    lineHeight: 24,
  },
  h5: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    lineHeight: 22,
  },
  h6: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 19,
  },
  
  // Body text
  bodyLarge: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    lineHeight: 27, // 150% of font size
  },
  bodyMedium: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24, // 150% of font size
  },
  bodySmall: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 21, // 150% of font size
  },
  
  // Labels
  labelLarge: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: 0.25,
  },
  labelMedium: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: 0.25,
  },
  labelSmall: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.5,
  },
  
  // Button text
  buttonLarge: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 0.25,
  },
  buttonMedium: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: 0.25,
  },
  buttonSmall: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: 0.25,
  },
  
  // Captions
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  captionBold: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
});