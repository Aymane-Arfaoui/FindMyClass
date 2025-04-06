import { LightTheme, DarkTheme, ColorBlindLightTheme, ColorBlindDarkTheme } from './themeStrategies';

export function getThemeStrategy(isDark = false, colorBlindMode = false) {
    if (colorBlindMode && isDark) return ColorBlindDarkTheme;
    if (colorBlindMode && !isDark) return ColorBlindLightTheme;
    if (!colorBlindMode && isDark) return DarkTheme;
    return LightTheme;
}
