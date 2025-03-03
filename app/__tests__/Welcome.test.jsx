import Welcome from '../Welcome.jsx';
import {render, screen, waitFor, userEvent, act} from '@testing-library/react-native';
import {Stack,useRouter, useSegments} from 'expo-router';

import { getUserInfo } from '../../services/userService';
let mockFun=jest.fn();
jest.mock('expo-auth-session/providers/google', ()=> (
    {useAuthRequest: jest.fn(()=>{
        return['',{type:'success',authentication:{accessToken:''}},mockFun];
    })}));
jest.mock('../../services/userService', ()=> ({getUserInfo: jest.fn()}));
jest.mock('../../services/calendarService', ()=> ({getCalendarEvents: jest.fn(),}));

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

        const user = userEvent.setup();
        const { unmount } =render(<Welcome/>);

        await user.press(screen.getByTestId('Google-login'));

        await waitFor(async ()=>{
            expect(mockFun).toBeCalled();
        });
        unmount();


    });
    it('should render the GET STARTED button correctly',   () => {
        render(<Welcome/>);
        expect(screen.getByTestId('welcome-button')).toBeOnTheScreen();
        expect(screen.getByTestId('welcome-button')).toHaveTextContent('GET STARTED');
    });

    it('should reroute to /homemap if GET STARTED button is pressed',  async () => {
        const mock={push:jest.fn()};
        useRouter.mockReturnValue(mock);
        const { unmount } =render(<Welcome/>);
        const user = userEvent.setup();
        await user.press(screen.getByTestId('welcome-button'));
        await waitFor(()=>{expect(mock.push).toHaveBeenCalledWith('/homemap');});
        unmount();
    });

    it('should reroute to /home if user sign-in is successful',   async () => {
        const mock = {replace: jest.fn()};
        useRouter.mockReturnValue(mock);
        getUserInfo.mockReturnValue("user")
        const { unmount } =render(<Welcome/>);
        const user = userEvent.setup();
        await user.press(screen.getByTestId('Google-login'));
        await waitFor(()=>{expect(mock.replace).toHaveBeenCalledWith('/home');});
        unmount();
    });

});