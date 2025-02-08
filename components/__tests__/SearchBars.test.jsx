import SearchBars from '../SearchBars.jsx';
import {render, screen, waitFor, userEvent, act, cleanup} from '@testing-library/react-native';
import {useRouter} from "expo-router";
import Index from "@/app";
import {renderRouter} from "expo-router/testing-library";
import RootLayout from "@/app/_layout";

jest.mock("expo-font");
jest.mock('expo-router', ()=> ({useRouter: jest.fn()}))
describe('SearchBars Component', () => {

    it('should render the default map marker',   () => {
        render(<SearchBars  />);
        expect(screen.getByTestId('map-marker-SearchBarComponent')).toBeOnTheScreen();


    });
    it('should render the default text correctly',   () => {
        render(<SearchBars  />);
        const defaultSource ='1455 Blvd. De Maisonneuve Ouest';
        const defaultDestination ='Concordia University - Loyola Campus';
        expect(screen.getByTestId('source-input')).toHaveDisplayValue(defaultSource);
        expect(screen.getByTestId('destination-input')).toHaveDisplayValue(defaultDestination);


    });

    it('should replace source and destination inputs when exchange button is pressed',  async () => {

       render(<SearchBars  />);
        const user = userEvent.setup();
        const oldSource ='1455 Blvd. De Maisonneuve Ouest';
        const oldDestination ='Concordia University - Loyola Campus';
        await user.press(screen.getByTestId('swap-location-button'));
        expect(screen.getByTestId('source-input')).toHaveDisplayValue(oldDestination);
        expect(screen.getByTestId('destination-input')).toHaveDisplayValue(oldSource);


    });
    it('should register user\'s input',  async () => {

        render(<SearchBars  />);
        const user = userEvent.setup();

        await user.clear(screen.getByTestId('source-input'));
        await user.clear(screen.getByTestId('destination-input'));

        await user.type(screen.getByTestId('source-input'),'test-source');
        await user.type(screen.getByTestId('destination-input'),'test-destination');

        expect(screen.getByTestId('source-input')).toHaveDisplayValue('test-source');
        expect(screen.getByTestId('destination-input')).toHaveDisplayValue('test-destination');


    });



});