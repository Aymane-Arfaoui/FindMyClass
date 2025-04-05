import Button from "@/components/Button";

jest.useFakeTimers()
import React from 'react';
import {render, fireEvent, waitFor, userEvent, screen} from '@testing-library/react-native';
import Homemap from '../homemap.jsx';
import { getUserLocation } from '@/services/userService';
import { fetchRoutes } from '@/services/routeService';
import {useLocalSearchParams, useRouter} from "expo-router";
import {useLocale} from "@react-navigation/native";


jest.mock('@rnmapbox/maps', () => {
    return {
        MapView: () => null,
        Camera: () => null,
        ShapeSource: () => <button name={'building-press'}/>,
        FillLayer: () => null,
        SymbolLayer: () => null,
        LineLayer: () => null,
        UserLocation: () => null,
        Annotation: () => null,
        CircleLayer:() => null,
        setAccessToken: jest.fn()
    };
});
jest.mock('expo-speech-recognition', () => ({
    requestPermissionAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    startAsync: jest.fn().mockResolvedValue({ success: true, error: null }),
    stopAsync: jest.fn().mockResolvedValue({ success: true }),
    cancelAsync: jest.fn().mockResolvedValue({ success: true }),
    isAvailableAsync: jest.fn().mockResolvedValue(true),
    useSpeechRecognitionEvent: jest.fn(),
}));
jest.mock('@/services/userService', () => ({
    getUserLocation: jest.fn(),
}));

jest.mock('@/services/routeService', () => ({
    fetchRoutes: jest.fn(),
}));



    describe('Homemap Component', () => {
        let spy=null;
        const mockFetch=jest.fn();
        afterEach(jest.clearAllMocks)
        beforeEach(() => {
            spy=jest.spyOn(global,'fetch').mockImplementation(()=>(
                    {
                        resp:{
                            json:jest.fn(
                                {routes: [
                                        {legs: [
                                                {duration:{value:5}}
                                            ]
                                        }
                                    ]
                                }
                            )
                        },
                        then:jest.fn()
                    }
                )
            )

            getUserLocation.mockResolvedValue({ lat: 45.4960, lng: -73.5789 });
            fetchRoutes.mockResolvedValue([
                {
                    duration: '300',
                    distance: '5000',
                },
            ]);

            useRouter.mockReturnValue({ push: jest.fn() });
            useLocalSearchParams.mockReturnValue({
                lat: 45.4960,
                lng: -73.5789,
                room : 102,
                address : '123 Test st',
                directionsTriggered : true,
                fromCalendar : false,
            })

        });

        test('renders correctly and fetches user location', async () => {
            render(<Homemap />);

            await waitFor(() => expect(getUserLocation).toHaveBeenCalledTimes(2));

        });




        it('direction-button', async () => {

            const mockLocation = { coords: { latitude:  45.4973, longitude: -73.5788  } };
            getUserLocation.mockResolvedValue(mockLocation);
            render(<Homemap/>);
            const user = userEvent.setup();
            await user.press(screen.getByTestId('direction-button'));
        });



        test('switches to directions view on direction button press', async () => {
            const mockLocation = { coords: { latitude: 45.4973, longitude: -73.5788 } };
            getUserLocation.mockResolvedValue(mockLocation);
            render(<Homemap />);

            const user = userEvent.setup();
            await user.press(screen.getByTestId('direction-button'));

            await waitFor(() => {
                expect(screen.queryByText('Loading...')).not.toBeOnTheScreen();
            });
        });


        it('should navigate back when back button is pressed', async () => {
            const user=userEvent.setup()
            useRouter.mockReturnValue({
                push: jest.fn(),
            });
             render(<Homemap />);


            await user.press(screen.getByTestId('back-button'));

            expect(useRouter().push).toHaveBeenCalledWith('/Welcome');
        });

        test('fetches places details on POI press', async () => {
            render(<Homemap />);


            const user = userEvent.setup();
            await user.press(screen.getByTestId('sgw-button'));

            await waitFor(() => {
                expect(screen.getByTestId('building-details-panel')).toBeTruthy();
            });
        });


    });
