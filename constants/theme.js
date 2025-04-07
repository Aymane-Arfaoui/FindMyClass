import { getThemeStrategy } from './themeSelector';

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
  const strategy = getThemeStrategy(isDark, colorBlindMode);
  const colors = strategy.getColors();

  return {
    colors,
    fonts,
    radius,
  };
}
