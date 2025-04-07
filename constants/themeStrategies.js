import {
    lightColors,
    darkColors,
    colorBlindLightColors,
    colorBlindDarkColors,
} from './colorPalettes';

export const LightTheme = {
    getColors: () => lightColors,
};

export const DarkTheme = {
    getColors: () => darkColors,
};

export const ColorBlindLightTheme = {
    getColors: () => colorBlindLightColors,
};

export const ColorBlindDarkTheme = {
    getColors: () => colorBlindDarkColors,
};
