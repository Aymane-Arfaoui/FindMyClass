import React, { createContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme } from '@/constants/theme';
import PropTypes from 'prop-types';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(false);
    const [colorBlindMode, setColorBlindMode] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadThemePreferences = async () => {
            try {
                const [storedTheme, storedCBMode, storedUser] = await Promise.all([
                    AsyncStorage.getItem('@theme'),
                    AsyncStorage.getItem('@colorBlindMode'),
                    AsyncStorage.getItem('@user'),
                ]);

                const hasUser = !!storedUser;

                setIsDark(storedTheme === 'dark' && hasUser);
                setColorBlindMode(storedCBMode === 'true' && hasUser);
            } catch (error) {
                console.error('Error loading theme:', error);
                setIsDark(false);
                setColorBlindMode(false);
            } finally {
                setIsLoaded(true);
            }
        };

        loadThemePreferences();
    }, []);

    const toggleTheme = useCallback(async () => {
        try {
            const newValue = !isDark;
            setIsDark(newValue);
            await AsyncStorage.setItem('@theme', newValue ? 'dark' : 'light');
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    }, [isDark]);

    const toggleColorBlindMode = useCallback(async () => {
        const newValue = !colorBlindMode;
        setColorBlindMode(newValue);
        await AsyncStorage.setItem('@colorBlindMode', newValue.toString());
    }, [colorBlindMode]);

    const theme = getTheme(isDark, colorBlindMode);

    if (!isLoaded) return null;

    return (
        <ThemeContext.Provider
            value={{ isDark, colorBlindMode, toggleTheme, toggleColorBlindMode, theme }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

ThemeProvider.propTypes = {
    children: PropTypes.node,
};
