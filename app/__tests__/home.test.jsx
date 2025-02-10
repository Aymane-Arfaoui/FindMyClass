import Home from '../home.jsx';
import {render, screen, waitFor, userEvent, act} from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Button from "@/components/Button";
import Welcome from "@/app/Welcome";


jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock') );

//mocking the useRouter
jest.mock('expo-router', ()=> ({useRouter: jest.fn()}));

describe('Home Component', () => {
    afterEach(
        ()=> {AsyncStorage.clear();}
    );

    it('should render ',   () => {
        render(<Home/>);
        expect(screen.getByTestId('screen-wrapper')).toBeOnTheScreen();

    });


    it('should render user card when a user is stored in async storage',   async () => {
        const user = JSON.stringify({name: "asd"});
        await AsyncStorage.setItem('@user', user);
        render(<Home/>);
        expect(await screen.findByTestId('user-card')).toBeOnTheScreen();
    });
    it('should render user picture when a user with a picture is stored in async storage',   async () => {
        const user = JSON.stringify({name: "asd",picture:'../assets/images/icon.png'});
        await AsyncStorage.setItem('@user', user);
        render(<Home/>);
        expect(await screen.findByTestId('user-picture')).toBeOnTheScreen();
    });

    it('should render user card when a user is stored in async storage',   async () => {
        const user = JSON.stringify({name: "test"});
        const event = JSON.stringify([{time: "test"}]);
        await AsyncStorage.setItem('@user', user);
        await AsyncStorage.setItem('@calendar', event);
        render(<Home/>);
        expect(await screen.findByTestId('calendar-events')).toBeOnTheScreen();
    });

    it('should reroute to "/" function if pressed sign out button is pressed',  async () => {
        const mock={replace:jest.fn()};
        useRouter.mockReturnValue(mock);
        render(<Home/>);
        const user = userEvent.setup();
        await user.press(screen.getByTestId('button'));
        expect(mock.replace).toHaveBeenCalledWith('/');


    });
});