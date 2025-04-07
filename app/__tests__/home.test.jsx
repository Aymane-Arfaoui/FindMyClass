jest.useFakeTimers()
import Home from '../home.jsx';
import {render, screen, waitFor, userEvent, act} from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";


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
const userMock = JSON.stringify({name: "test"});
describe('Home page', () => {
    afterEach(
        ()=> {AsyncStorage.clear();}

    );

    it('should render ',   () => {
        const { unmount } =render(<Home/>);
        expect(screen.getByTestId('screen-wrapper')).toBeOnTheScreen();
        unmount();
    });


    it('should render user card when a user is stored in async storage',   async () => {
        await AsyncStorage.setItem('@user', userMock);
        const { unmount } =render(<Home/>);
        expect(await screen.findByTestId('user-card')).toBeOnTheScreen();
        unmount();
    });
    it('should render user picture when a user with a picture is stored in async storage',   async () => {
        const userMock = JSON.stringify({name: "asd",picture:'../assets/images/icon.png'});
        await AsyncStorage.setItem('@user', userMock);
        const { unmount } =render(<Home/>);
        expect(await screen.findByTestId('user-picture')).toBeOnTheScreen();
        unmount();
    });

    it('should render user card when a user is stored in async storage',   async () => {
        await AsyncStorage.setItem('@user', userMock);
        await AsyncStorage.setItem('@calendar', event);
        const { unmount } =render(<Home/>);
        expect(await screen.findByTestId('user-card')).toBeOnTheScreen();
        unmount();
    });



});