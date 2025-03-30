import React, {createContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getTheme} from '@/constants/theme';

export const ThemeContext = createContext();

export function ThemeProvider({children}) {
    const [isDark, setIsDark] = useState(false);
    const [colorBlindMode, setColorBlindMode] = useState(false);

    useEffect(() => {
        (async () => {
            const storedUser = await AsyncStorage.getItem('@user');
            if (!storedUser) {
                setIsDark(false);
                setColorBlindMode(false);
                return;
            }

            const storedTheme = await AsyncStorage.getItem('@theme');
            const storedCBMode = await AsyncStorage.getItem('@colorBlindMode');

            const darkMode = storedTheme === 'dark';
            const cbMode = storedCBMode === 'true';

            setIsDark(darkMode);
            setColorBlindMode(cbMode);
        })();
    }, []);


    const toggleTheme = async () => {
        const newValue = !isDark;
        setIsDark(newValue);
        await AsyncStorage.setItem('@theme', newValue ? 'dark' : 'light');
    };

    const toggleColorBlindMode = async () => {
        const newValue = !colorBlindMode;
        setColorBlindMode(newValue);
        await AsyncStorage.setItem('@colorBlindMode', newValue.toString());
    };

    const theme = getTheme(isDark, colorBlindMode);

    return (
        <ThemeContext.Provider
            value={{isDark, colorBlindMode, toggleTheme, toggleColorBlindMode, theme}}
        >
            {children}
        </ThemeContext.Provider>
    );
}
