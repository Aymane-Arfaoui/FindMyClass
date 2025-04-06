import {getTheme} from "@/constants/theme";
import React, { useContext } from 'react';
import {ThemeContext} from '@/context/ThemeProvider';
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock') );

jest.mock('expo-router',
    ()=> (
        {
            useRouter: jest.fn(),
            useSegments:jest.fn(),
            Stack:jest.fn(),
            usePathname:jest.fn(),
            useLocalSearchParams:jest.fn(),
        }
    ));
jest.mock('expo-font');

jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');
jest.mock('react-native-vector-icons/FontAwesome5',() => 'Icon');
jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => null,
    FontAwesome:()=>null
}));
jest.mock('@react-navigation/native', () => ({
    useNavigation: jest.fn(),
    useRoute: jest.fn(),
}));


const theme = getTheme(false, false);

const isThemeContext=(context)=>  {return context === ThemeContext;}
// Default mock values for ThemeContext
const mockThemeContext = {
    isDark: false,
    colorBlindMode: false,
    toggleTheme: jest.fn(),
    toggleColorBlindMode: jest.fn(),
    theme: theme,
};

const chooseContext=(context)=>  {
    if(isThemeContext(context))
        return mockThemeContext;
    else
        return jest.requireActual('react').useContext;
};
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useContext: chooseContext
}));




