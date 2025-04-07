import React, {createContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme } from '@/constants/theme';
import PropTypes from "prop-types";


export const ThemeContext = createContext();

export function ThemeProvider({children}) {
    const [isDark, setIsDark] = useState(false);
    const [colorBlindMode, setColorBlindMode] = useState(false);

    useEffect(() => {
        (async () => {
            const storedTheme = await AsyncStorage.getItem('@theme');
            if (storedTheme === 'dark') {
                setIsDark(true);
            }
            const storedUser = await AsyncStorage.getItem('@user');
            if (!storedUser) {
                setIsDark(false);
                setColorBlindMode(false);
                return;
            }

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
ThemeProvider.propTypes={
    children: PropTypes.node
}
