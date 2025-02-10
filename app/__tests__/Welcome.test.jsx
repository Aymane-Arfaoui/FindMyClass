import Welcome from '../Welcome.jsx';
import {render, screen, waitFor, userEvent, act} from '@testing-library/react-native';
import {Stack,useRouter, useSegments} from 'expo-router';
import {AuthProvider} from "@/context/auth";
import react from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAuthRequest from 'expo-auth-session/providers/google';
import { getUserInfo } from '../../services/userService'
import { getCalendarEvents } from '../../services/calendarService'
import LiveLocationButton from "@/components/LiveLocationButton";
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock') );
let mockFun=jest.fn();
jest.mock('expo-auth-session/providers/google', ()=> (
    {useAuthRequest: jest.fn(()=>{
        return['',{type:'success',authentication:{accessToken:''}},mockFun];
    })}));
jest.mock('../../services/userService', ()=> ({getUserInfo: jest.fn()}));
jest.mock('../../services/calendarService', ()=> ({getCalendarEvents: jest.fn(),}));
//mocking the useRouter
jest.mock('expo-router', ()=> ({useRouter: jest.fn()}));
describe('Welcome Component', () => {

    it('should render',   () => {
        render(<Welcome/>);
        expect(screen.getByTestId('welcome')).toBeOnTheScreen();
    });
    it('should render the background image',   () => {
        render(<Welcome/>);
        expect(screen.getByTestId('welcome-background-image')).toBeOnTheScreen();
    });

    it('should render the title',   () => {
        render(<Welcome/>);
        expect(screen.getByTestId('welcome-title')).toBeOnTheScreen();
        expect(screen.getByTestId('welcome-title')).toHaveTextContent('Welcome');
    });

    it('should render the google login button correctly',   () => {
        render(<Welcome/>);
        expect(screen.getByTestId('Google-login')).toBeOnTheScreen();
        expect(screen.getByTestId('Google-login')).toHaveTextContent('CONTINUE WITH GOOGLE');
    });

    it('should trigger a function if login with google button is pressed',  async () => {
        render(<Welcome/>);
        const user = userEvent.setup();
        await user.press(screen.getByTestId('Google-login'));
        expect(mockFun).toBeCalled();


    });
    it('should render the GET STARTED button correctly',   () => {
        render(<Welcome/>);
        expect(screen.getByTestId('welcome-button')).toBeOnTheScreen();
        expect(screen.getByTestId('welcome-button')).toHaveTextContent('GET STARTED');
    });

    it('should reroute to /homemap if GET STARTED button is pressed',  async () => {
        const mock={push:jest.fn()};
        useRouter.mockReturnValue(mock);
        render(<Welcome/>);
        const user = userEvent.setup();
        await user.press(screen.getByTestId('welcome-button'));
        expect(mock.push).toHaveBeenCalledWith('/homemap');
    });

});