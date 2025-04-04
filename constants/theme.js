export const theme = {
    colors: {
      primary: '#912238',        // Main brand color - deep maroon
      primaryLight: '#B15A6C',   // Lighter version of primary for hover states
      primaryDark: '#6D1A2A',    // Darker version of primary for depth
      secondary: '#F5E6E8',      // Very light pink for subtle backgrounds
      secondaryDark: '#D2A4A8',
      dark: '#1A1A1A',          // Near black for primary text
      darkLight: '#4A4A4A',     // Softer dark for secondary text
      gray: '#E5E5E5',          // Light gray for borders
      grayDark: '#757575',      // Darker gray for subtle text
      text: '#2D2D2D',          // Primary text color
      textLight: '#6E6E6E',     // Secondary text color
      white: '#FFFFFF',         // Pure white
      button: '#912238',        // Using primary color for buttons
      loading: '#912238',       // Matching button color
      success: '#2D8A6B',       // Green for success states
      warning: '#F0B775',       // Warm orange for warnings
      error: '#D64045',         // Red for errors
      background: '#FAFAFA', // Very light gray for backgrounds
      blueDark: '#004085',      // Dark blue for the buttons
      blueLight: '#1A73E8'      // Light blue for the buttons
    },
    fonts: {
      medium: '500',            // Medium-weight font for general text
      semibold: '600',          // Semi-bold font for emphasis (e.g., buttons, labels)
      bold: '700',              // Bold font for titles or key text
      extraBold: '800',         // Extra-bold font for standout headings
    },
    radius: {
      xs: 8,                    // Small corner radius for inputs, small cards
      sm: 10,                   // Slightly larger for medium components
      md: 12,                   // Medium corner radius for standard buttons/cards
      lg: 14,                   // Larger radius for modals or prominent elements
      xl: 16,                   // Extra-large for larger UI elements
      xxl: 20,                  // Very large radius for modern, round designs
    },
  };

import {
  lightColors,
  darkColors,
  colorBlindLightColors,
  colorBlindDarkColors,
} from "@/constants/colorPalettes";

const fonts = {
  medium: '500',
  semibold: '600',
  bold: '700',
  extraBold: '800',
};

const radius = {
  xs: 8,
  sm: 10,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 20,
};

export function getTheme(isDark = false, colorBlindMode = false) {
  let colors;

  if (colorBlindMode && isDark) {
    colors = colorBlindDarkColors;
  } else if (colorBlindMode && !isDark) {
    colors = colorBlindLightColors;
  } else {
    colors = isDark ? darkColors : lightColors;
  }

  return {
    colors,
    fonts,
    radius,
  };
}
