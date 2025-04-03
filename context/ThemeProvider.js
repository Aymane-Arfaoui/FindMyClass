import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme } from '@/constants/theme';
import PropTypes from "prop-types";

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const storedTheme = await AsyncStorage.getItem('@theme');
                if (storedTheme === 'dark') {
                    setIsDark(true);
                }
            } catch (error) {
                console.error('Error loading theme:', error);
                // Fallback to light theme in case of error
                setIsDark(false);
            }
        })();
    }, []);

    const toggleTheme = async () => {
        try {
            const newValue = !isDark;
            setIsDark(newValue);
            await AsyncStorage.setItem('@theme', newValue ? 'dark' : 'light');
        } catch (error) {
            console.error('Error saving theme:', error);
            // Revert the theme if saving fails
            setIsDark(!newValue);
        }
    };

    const theme = getTheme(isDark);

    return (
        <ThemeContext.Provider value={{ isDark, theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
ThemeProvider.propTypes={
    children: PropTypes.node
}
