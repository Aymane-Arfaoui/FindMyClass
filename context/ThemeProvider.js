import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme } from '@/constants/theme';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        (async () => {
            const storedTheme = await AsyncStorage.getItem('@theme');
            if (storedTheme === 'dark') {
                setIsDark(true);
            }
        })();
    }, []);

    const toggleTheme = async () => {
        const newValue = !isDark;
        setIsDark(newValue);
        await AsyncStorage.setItem('@theme', newValue ? 'dark' : 'light');
    };

    const theme = getTheme(isDark);

    return (
        <ThemeContext.Provider value={{ isDark, theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
