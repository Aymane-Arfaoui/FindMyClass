import SearchBars from '../SearchBars.jsx';
import {render, screen, waitFor, userEvent, act, cleanup} from '@testing-library/react-native';
import {useRouter} from "expo-router";
import Index from "@/app";

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock') );
jest.mock("expo-font");
jest.mock('expo-router', ()=> ({useRouter: jest.fn()}));
describe('SearchBars Component', () => {

    it('should render the default map marker',   () => {
        const { unmount } =render(<SearchBars  />);
        expect(screen.getByTestId('map-marker-SearchBarComponent')).toBeOnTheScreen();

        unmount();
    });
    it('should render the default text correctly',   () => {
        const { unmount } =render(<SearchBars  />);
        const defaultSource ='1455 Blvd. De Maisonneuve Ouest';
        const defaultDestination ='Concordia University - Loyola Campus';
        expect(screen.getByTestId('source-input')).toHaveDisplayValue(defaultSource);
        expect(screen.getByTestId('destination-input')).toHaveDisplayValue(defaultDestination);
        unmount();

    });

    it('should replace source and destination inputs when exchange button is pressed',  async () => {

        const { unmount } =render(<SearchBars  />);
        const user = userEvent.setup();
        const oldSource ='1455 Blvd. De Maisonneuve Ouest';
        const oldDestination ='Concordia University - Loyola Campus';
        await user.press(screen.getByTestId('swap-location-button'));
        expect(screen.getByTestId('source-input')).toHaveDisplayValue(oldDestination);
        expect(screen.getByTestId('destination-input')).toHaveDisplayValue(oldSource);
        unmount();


    });
    it('should register user\'s input',  async () => {

        const { unmount } =render(<SearchBars  />);
        const user = userEvent.setup();

        await user.clear(screen.getByTestId('source-input'));
        await user.clear(screen.getByTestId('destination-input'));

        await user.type(screen.getByTestId('source-input'),'test-source');
        await user.type(screen.getByTestId('destination-input'),'test-destination');

        expect(screen.getByTestId('source-input')).toHaveDisplayValue('test-source');
        expect(screen.getByTestId('destination-input')).toHaveDisplayValue('test-destination');

        unmount();
    });

    it('should call the router when back button is pressed',  async () => {
        jest.useFakeTimers();
        //making the useRouter function return a mock Function when push is called
        const mock = {back: jest.fn()};
        useRouter.mockReturnValue(mock);

        const { unmount } =render(<SearchBars/>);

        const user = userEvent.setup();
        await user.press(screen.getByTestId('go-back-button-SearchBarComponent'));

        expect(mock.back).toHaveBeenCalled();

        unmount();
        jest.clearAllMocks();

    });



});