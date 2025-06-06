import AsyncStorage from "@react-native-async-storage/async-storage";

jest.useFakeTimers()
import React from 'react';
import {render, screen, userEvent,waitFor} from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import User from '../user.jsx';
import {Alert} from "react-native";
jest.mock('expo-auth-session/providers/google', ()=> (
    {useAuthRequest: jest.fn(()=>{
            return[{type:'success'},{type:'success',authentication:{accessToken:''}},jest.fn()];
        })}));

jest.mock('../../services/userService', ()=> ({getUserInfo: jest.fn(()=>({name:'asd'}))}));
jest.spyOn(Alert, 'alert').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
describe('User', () => {
    const mockPush = jest.fn();
    const mockRouterBack = jest.fn();
    const mockEvents = [{ id: 1, location: 'Hall Building Rm 101', start: { dateTime: new Date() }, summary: 'Test Event' }];

    beforeEach(() => {
        jest.clearAllMocks()
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
        await AsyncStorage.setItem('@user',JSON.stringify({name:"asd"}))
        await AsyncStorage.setItem('@calendar',JSON.stringify(mockEvents))
        render(<User/>);

        const calendarButton = screen.getByTestId('calendar-button');
        await user.press(calendarButton);
        expect(mockPush).toHaveBeenCalled()
        await AsyncStorage.clear()
    });


    it('navigates to settings page on settings icon press', async () => {
        const user = userEvent.setup();
        render(<User/>);

        const settingsIcon = screen.getByTestId('settings-button');
        await user.press(settingsIcon);

        // Check that the router.push function was called with the correct argument
        expect(mockPush).toHaveBeenCalledWith('/settingsPage');
    });



    it('navigates to smartPlanner when "See All" is pressed', async () => {
        const user = userEvent.setup();
        render(<User/>);

        const seeAllButton = screen.getByText('See All');
        await user.press(seeAllButton);

        expect(mockPush).toHaveBeenCalledWith('/smartPlanner');
    });
});

