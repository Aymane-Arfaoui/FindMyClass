import BottomPanel from '../BottomPanel.jsx';
import {render, screen, waitFor, userEvent, act} from '@testing-library/react-native';
import { useRouter } from 'expo-router';

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

    it('should display the route details if provided',  async () => {
        const route = {mode:'test',duration: 'test', distance: 'test'}
        render(<BottomPanel routeDetails={route}/>);
        expect(await screen.findByTestId('route-details')).toBeOnTheScreen();


    });

    it('should a scroll view when toggle button is pressed ',  async () => {
        jest.useFakeTimers();
        const route={mode:'test',duration:'test',distance:'test'}
        render(<BottomPanel routeDetails={route}/>);

        const user = userEvent.setup();
        await user.press(screen.getByTestId('toggle-button'));
        act(() => {
            jest.runAllTimers();
        });
        expect(screen.getByTestId('expanded')).toBeOnTheScreen();
    expect(screen.getByTestId('chevron')).toBeOnTheScreen();

    });
    it('should display the toggle button',  async () => {

        const route = {mode:'test',duration: 'test', distance: 'test'}
        render(<BottomPanel routeDetails={route}/>);
        expect(await screen.findByTestId('toggle-button')).toBeOnTheScreen();

    });

    it('should switch to shuttle route when switch to shuttle route button is pressed ',  async () => {
        const pushMock=jest.fn();
        useRouter.mockReturnValue({push: pushMock});
        jest.useFakeTimers();
        const routes=[{mode:"shuttle",duration:'test',distance:'test'},{mode:"other",duration:'test',distance:'test'}]
        render(<BottomPanel routes={routes}/>);

        const user = userEvent.setup();
        await user.press(screen.getByTestId('toggle-button'));
        act(() => {
            jest.runAllTimers();
        });

        await user.press(await screen.findByTestId('shuttle-route-button'));


        expect(pushMock).toBeCalled();

    });


    it('should switch to another route when switch route button is pressed ',  async () => {

        jest.useFakeTimers();
        const routes=[{mode:"shuttle",duration:'test',distance:'test'},{mode:"other",duration:'test',distance:'test'}]
        render(<BottomPanel  routes={routes}/>);

        const user = userEvent.setup();
        await user.press(screen.getByTestId('toggle-button'));
        act(() => {
            jest.runAllTimers();
        });

        await user.press(await screen.findByTestId('switch-route-button'));

        expect(screen.getByTestId('selected-route-details')).toHaveTextContent(/^Mode: OTHER/);

        expect(await screen.findByTestId('selected-route-details')).toBeOnTheScreen();

    });

    it('should display steps if transit mode ',  async () => {

        jest.useFakeTimers();
        const routes=[{mode:"transit",steps:[{instruction:'test',vehicle:'a',departure_time:"1",arrival_time:'1'}],duration:'test',distance:'test'}]
        render(<BottomPanel routes={routes}/>);

        const user = userEvent.setup();
        await user.press(screen.getByTestId('toggle-button'));
        act(() => {
            jest.runAllTimers();
        });

        await user.press(await screen.findByTestId('switch-route-button'));


        expect(await screen.findByTestId('transit-steps')).toBeOnTheScreen();

    });
    it('should display steps if there are steps but not transit mode ',  async () => {

        jest.useFakeTimers();
        const routes=[{mode:"other",steps:[{instruction:'test',maneuver:'a'}],duration:'test',distance:'test'}]
        render(<BottomPanel routes={routes}/>);

        const user = userEvent.setup();
        await user.press(screen.getByTestId('toggle-button'));
        act(() => {
            jest.runAllTimers();
        });

        await user.press(await screen.findByTestId('switch-route-button'));


        expect(await screen.findByTestId('other-mode-steps')).toBeOnTheScreen();

    });

    it('should show no steps if no steps are provided ',  async () => {

        jest.useFakeTimers();
        const routes=[{mode:"shuttle",duration:'test',distance:'test'},{mode:"other",duration:'test',distance:'test'}]
        render(<BottomPanel routes={routes}/>);

        const user = userEvent.setup();
        await user.press(screen.getByTestId('toggle-button'));
        act(() => {
            jest.runAllTimers();
        });

        await user.press(await screen.findByTestId('switch-route-button'));


        expect(await screen.findByTestId('selected-route-details')).toHaveTextContent(/No step-by-step instructions available.$/);

    });
    // it('should make the modal visible when the button is pressed',  async () => {
    //     jest.useFakeTimers();
    //     const routes=[{mode:"shuttle",duration:'test',distance:'test'},{mode:"other",duration:'test',distance:'test'}]
    //     render(<BottomPanel routes={routes}/>);
    //     expect(screen.getByTestId('modal')).not.toBeOnTheScreen();
    //
    //     const user = userEvent.setup();
    //
    //
    //
    //     await user.press(screen.getByTestId('toggle-button'));
    //     act(() => {
    //         jest.runAllTimers();
    //     });
    //
    //     await user.press(await screen.findByTestId('switch-route-button'));
    //
    //
    //     await user.press(screen.getByTestId('modal-button'));
    //
    //     expect(await screen.findByTestId('modal')).toBeOnTheScreen();
    //
    // });

});