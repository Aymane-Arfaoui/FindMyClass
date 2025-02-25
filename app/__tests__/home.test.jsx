import Home from '../home.jsx';
import {render, screen, waitFor, userEvent, act} from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Button from "@/components/Button";
import Welcome from "@/app/Welcome";


jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock') );
jest.mock('expo-font');
//mocking the useRouter
jest.mock('expo-router', ()=> ({useRouter: jest.fn()}));
const event = JSON.stringify([{
    "summary": "test1",
    "location": "test1",
    "description": "test1",
    "start": {
        "dateTime": "2025-02-10T10:00:00-05:00",
        "timeZone": "America/New_York"
    },
    "end": {
        "dateTime": "2025-02-10T11:00:00-05:00",
        "timeZone": "America/New_York"
    }
}]);
describe('Home Component', () => {
    afterEach(
        ()=> {AsyncStorage.clear();}

    );

    it('should render ',   () => {
        const { unmount } =render(<Home/>);
        expect(screen.getByTestId('screen-wrapper')).toBeOnTheScreen();
        unmount();
    });


    it('should render user card when a user is stored in async storage',   async () => {
        const user = JSON.stringify({name: "asd"});
        await AsyncStorage.setItem('@user', user);
        const { unmount } =render(<Home/>);
        expect(await screen.findByTestId('user-card')).toBeOnTheScreen();
        unmount();
    });
    it('should render user picture when a user with a picture is stored in async storage',   async () => {
        const user = JSON.stringify({name: "asd",picture:'../assets/images/icon.png'});
        await AsyncStorage.setItem('@user', user);
        const { unmount } =render(<Home/>);
        expect(await screen.findByTestId('user-picture')).toBeOnTheScreen();
        unmount();
    });

    it('should render user card when a user is stored in async storage',   async () => {
        const user = JSON.stringify({name: "test"});

        await AsyncStorage.setItem('@user', user);
        await AsyncStorage.setItem('@calendar', event);
        const { unmount } =render(<Home/>);
        expect(await screen.findByTestId('user-card')).toBeOnTheScreen();
        unmount();
    });

    it('should reroute to "/"  if sign out button is pressed',  async () => {
        const mock={replace:jest.fn()};
        useRouter.mockReturnValue(mock);
        const userMock = JSON.stringify({name: "test"});
        await AsyncStorage.setItem('@user', userMock);
        await AsyncStorage.setItem('@calendar', event);
        const { unmount } =render(<Home/>);
        const user = userEvent.setup();
        await user.press(await screen.findByTestId('button'));
        expect(mock.replace).toHaveBeenCalledWith('/');
        unmount();


    });
    it('should reroute to "/calendar" if calendar button is pressed',  async () => {
        const mock={push:jest.fn()};
        useRouter.mockReturnValue(mock);
        const userMock = JSON.stringify({name: "test"});
        await AsyncStorage.setItem('@user', userMock);
        await AsyncStorage.setItem('@calendar', event);
        const { unmount } =render(<Home/>);
        const user = userEvent.setup();
        await user.press(await screen.findByTestId('calendar-button'));
        expect(mock.push).toHaveBeenCalledWith('/calendar');
        unmount();


    });
});