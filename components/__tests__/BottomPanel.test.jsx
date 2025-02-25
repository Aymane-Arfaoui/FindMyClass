import BottomPanel from '../BottomPanel.jsx';
import {render, screen, waitFor, userEvent, act} from '@testing-library/react-native';
import { useRouter } from 'expo-router';


jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock') );


jest.mock('expo-font');
describe('BottomPanel Component', () => {

    it('should render the bottom panel correctly',  async () => {
        const { unmount } =render(<BottomPanel/>);
        expect(await screen.findByTestId("bottom-panel")).toBeOnTheScreen();

        unmount();
    });
    it('should show No route available if the route is not provided',  async () => {
        const { unmount } =render(<BottomPanel/>);
        expect(await screen.findByText("No route available")).toBeOnTheScreen();

        unmount();
    });

    it('should display the route if provided',  async () => {
        const route = {duration: 'test', distance: 'test'}
        render(<BottomPanel routeDetails={route}/>);
        expect(await screen.findByTestId('route-details')).toBeOnTheScreen();


    });
    it('should display the route if provided',  async () => {
        jest.useFakeTimers();
        const route={duration:'test',distance:'test'}
        render(<BottomPanel routeDetails={route}/>);

        const user = userEvent.setup();
        await user.press(screen.getByTestId('toggle-button'));
        act(() => {
            jest.runAllTimers();
        });
    expect(screen.getByTestId('chevron')).toBeOnTheScreen();

    });
    it('should display the toggle button',  async () => {

        const route = {duration: 'test', distance: 'test'}
        render(<BottomPanel routeDetails={route}/>);
        expect(await screen.findByTestId('toggle-button')).toBeOnTheScreen();

    });

});