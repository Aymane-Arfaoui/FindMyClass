import Index from '../index.jsx';
import {render, screen, waitFor, userEvent, act} from '@testing-library/react-native';
import { useRouter } from 'expo-router'


jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock') );
//mocking the useRouter
jest.mock('expo-router', ()=> ({useRouter: jest.fn()}));

describe('Index Component', () => {

    it('should render the text and button correctly',  async () => {
        render(<Index/>);
        expect(await screen.findByTestId("index-image")).toBeOnTheScreen();


    });

    it('should call the router after some time',  () => {
        jest.useFakeTimers();
        //making the useRouter function return a mock Function when push is called
        const mock={push:jest.fn()};
        useRouter.mockReturnValue(mock);

        render(<Index/>);

        act(() => {
            jest.runAllTimers();
            expect(mock.push).toHaveBeenCalled();
        });

        jest.clearAllMocks();

    });

});