import {ThemeContext} from "@/context/ThemeProvider";

jest.useFakeTimers()
import React, {useContext} from 'react';
import {render, fireEvent, screen, userEvent} from '@testing-library/react-native';
import Settings from '../settingsPage';
import {useRouter} from "expo-router";


describe('Settings', () => {
    const mockRouterBack = jest.fn();

    const {isDark, toggleTheme, colorBlindMode, toggleColorBlindMode, theme} = useContext(ThemeContext);
    beforeEach(() => {
        useRouter.mockReturnValue({
            back: mockRouterBack,
        });
    });

    it('renders Settings screen with default state', () => {
        render(<Settings />);

        expect(screen.getByText('Settings')).toBeTruthy();

        expect(screen.getByText('Dark Mode')).toBeTruthy();
        expect(screen.getByText('Color Blind Mode')).toBeTruthy();

        const darkModeSwitch = screen.getByTestId('dark-mode-switch');
        expect(darkModeSwitch.props.value).toBe(false);

        const colorBlindModeSwitch = screen.getByTestId('color-blind-mode-switch');
        expect(colorBlindModeSwitch.props.value).toBe(false);
    });

    it('toggles Dark Mode switch', () => {
        render(<Settings />);

        const darkModeSwitch = screen.getByTestId('dark-mode-switch');

        fireEvent(darkModeSwitch, 'valueChange', true);

        expect(toggleTheme).toHaveBeenCalled();
    });

    it('toggles Color Blind Mode switch', () => {
        render(<Settings />);

        const colorBlindModeSwitch = screen.getByTestId('color-blind-mode-switch');

        fireEvent(colorBlindModeSwitch, 'valueChange', true);

        expect(toggleColorBlindMode).toHaveBeenCalled();
    });

    it('navigates back when back button is pressed', async () => {
        const user=userEvent.setup()
        render(<Settings />);

        const backButton = screen.getByTestId('back-button');
        await user.press(backButton);

        // Ensure that the router back function was called
        expect(mockRouterBack).toHaveBeenCalled();
    });
});
