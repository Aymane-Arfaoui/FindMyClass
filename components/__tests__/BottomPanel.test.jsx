import BottomPanel from '../BottomPanel.jsx';
import {render, screen, waitFor, userEvent, act} from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import {getShuttleTravelTime, isShuttleRunningNow} from "@/services/shuttleService";
import {fetchGoogleRoutes} from "@/services/routeService";
jest.mock('@/services/shuttleService', () => ({
    isShuttleRunningNow: jest.fn(),
    getShuttleTravelTime: jest.fn(),
}));

jest.mock('@/services/routeService', () => ({
    fetchGoogleRoutes:jest.fn() ,
}));
describe('BottomPanel Component', () => {
    const travelTimes={
       DRIVE:"5 min",
        TRANSIT: "5 min",
        WALK: "5 min",
        BICYCLE: "5 min",
    }
    const SGW = {
        lat: 45.495,
        lng: -73.570
    };

    const LOYOLA = {
        lat: 45.450,
        lng: -73.640,
    };


    it('should render the bottom panel correctly',  async () => {
        render(<BottomPanel transportMode={'test'} travelTimes={travelTimes}/>);
        expect(await screen.findByTestId("bottom-panel")).toBeOnTheScreen();

    });
    it('should show No route available if the route is not provided',  async () => {
        render(<BottomPanel transportMode={'test'} travelTimes={travelTimes}/>);
        expect(await screen.findByText("No route available")).toBeOnTheScreen();

    });

    it('should display the route details if provided',  async () => {
        const route = {mode:'test',duration: 'test', distance: 'test'}
        render(<BottomPanel transportMode={'test'} routeDetails={route} travelTimes={travelTimes}/>);
        expect(await screen.findByTestId('route-details')).toBeOnTheScreen();


    });

    it('should a scroll view when toggle button is pressed ',  async () => {
        jest.useFakeTimers();
        const route={mode:'test',duration:'test',distance:'test'}
        render(<BottomPanel transportMode={'test'} routeDetails={route} travelTimes={travelTimes}/>);

        const user = userEvent.setup();
        await user.press(screen.getByTestId('toggle-button'));
        act(() => {
            jest.runAllTimers();
        });
        expect(screen.getByTestId('expanded')).toBeOnTheScreen();

    });
    it('should display the toggle button',  async () => {

        const route = {mode:'test',duration: 'test', distance: 'test'}
        render(<BottomPanel transportMode={'test'} routeDetails={route} travelTimes={travelTimes}/>);
        expect(await screen.findByTestId('toggle-button')).toBeOnTheScreen();

    });

    it('should switch to shuttle route when switch to shuttle route button is pressed ',  async () => {
        jest.useFakeTimers();
        isShuttleRunningNow.mockReturnValue(true)
        const routes=[{mode:"shuttle",duration:'test',distance:'test'},{mode:"test",duration:'test',distance:'test'}]
        render(<BottomPanel transportMode={'shuttle'} routes={routes} travelTimes={travelTimes} startLocation={SGW} endLocation={LOYOLA}/>);

        const user = userEvent.setup();
        await user.press(screen.getByTestId('toggle-button'));
        act(() => {
            jest.runAllTimers();
        });

        await user.press(await screen.findByTestId('shuttle-route-button'));

        expect(isShuttleRunningNow).toBeCalled();
        expect(fetchGoogleRoutes).toBeCalled();

    });


    it('should switch to another route when switch route button is pressed ',  async () => {

        jest.useFakeTimers();
        const routes=[{mode:"shuttle",duration:'test',distance:'test'},{mode:"other",duration:'test',distance:'test'}]
        render(<BottomPanel  transportMode={'test'} routes={routes} travelTimes={travelTimes}/>);

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
        render(<BottomPanel transportMode={'test'} routes={routes} travelTimes={travelTimes}/>);

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
        render(<BottomPanel transportMode={'test'} routes={routes} travelTimes={travelTimes}/>);

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
        render(<BottomPanel routes={routes} travelTimes={travelTimes}/>);

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