jest.useFakeTimers()
import React from 'react';
import {render, fireEvent, waitFor, userEvent, screen} from '@testing-library/react-native';
import Homemap from '../Homemap'; 
import { getUserLocation } from '@/services/userService';
import { fetchRoutes } from '@/services/routeService';
import {useRouter} from "expo-router";


jest.mock('@rnmapbox/maps', () => {
    return {
        MapView: () => null,
        Camera: () => null,
        ShapeSource: () => null,
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
        afterAll(jest.restoreAllMocks)
        beforeAll(()=>{spy=jest.spyOn(global,'fetch').mockImplementation(()=>(
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
        )});
        beforeEach(() => {
            // Mock default return values

            getUserLocation.mockResolvedValue({ lat: 45.4960, lng: -73.5789 });
            fetchRoutes.mockResolvedValue([
                {
                    duration: '300',
                    distance: '5000',
                },
            ]);

            useRouter.mockReturnValue({ push: jest.fn() });

        });

        test('renders correctly and fetches user location', async () => {
            render(<Homemap />);

            expect(screen.getByText('Loading...')).toBeTruthy();

            // Wait for location to be fetched
            await waitFor(() => expect(getUserLocation).toHaveBeenCalledTimes(2));

        });




        it('direction-button', async () => {

            const mockLocation = { coords: { latitude:  45.4973, longitude: -73.5788  } };
            getUserLocation.mockResolvedValue(mockLocation);
            render(<Homemap/>);
            const user = userEvent.setup();
            await user.press(screen.getByTestId('direction-button'));
        });

        // it('handles errors during fetch and sets state to null', async () => {
        //     // Mock the fetch implementation to simulate an error
        //
        //     spy.mockRejectedValue(new Error('Failed to fetch'));
        //     const mockConsole=jest.spyOn(console,"error").mockImplementation(()=>{})
        //
        //     // Render your component
        //     render(<Homemap />);
        //     await waitFor(() => {
        //         // Check for error handling or absence of building details
        //         //const noDetailsMessage = screen.queryByText(/Error fetching building details/i);
        //         expect(mockConsole).toBeCalled();
        //     });
        // });

    });