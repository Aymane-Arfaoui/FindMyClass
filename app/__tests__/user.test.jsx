
jest.useFakeTimers()
import React from 'react';
import {render, screen, userEvent,waitFor} from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import User from '../user.jsx';

describe('User Component', () => {
    const mockPush = jest.fn();
    const mockRouterBack = jest.fn();

    beforeEach(() => {
        // Reset mocks before each test
        useRouter.mockReturnValue({
            push: mockPush,
            back: mockRouterBack,
        });
    });

    it('renders correctly with default user info', async () => {
        const {unmount}=render(<User />);

        await waitFor(()=>{
            expect(screen.getByText('Welcome back')).toBeTruthy();
            const calendarButton = screen.getByTestId('calendar-button');
            expect(calendarButton).toBeTruthy();
            expect(screen.getByText('See All')).toBeTruthy();
        })
        unmount()

    });

    it('navigates to calendar on calendar button press', async () => {
        const user = userEvent.setup();
        render(<User/>);

        const calendarButton = screen.getByTestId('calendar-button');
        await user.press(calendarButton);

        expect(mockPush).toHaveBeenCalledWith('/calendar');
    });

    it('navigates to settings page on settings icon press', async () => {
        const user = userEvent.setup();
        render(<User/>);

        const settingsIcon = screen.getByTestId('settings-button');
        await user.press(settingsIcon);

        // Check that the router.push function was called with the correct argument
        expect(mockPush).toHaveBeenCalledWith('/settingsPage');
    });



    it('navigates to calendar when "See All" is pressed', async () => {
        const user = userEvent.setup();
        render(<User/>);

        const seeAllButton = screen.getByText('See All');
        await user.press(seeAllButton);

        expect(mockPush).toHaveBeenCalledWith('/calendar');
    });
});

