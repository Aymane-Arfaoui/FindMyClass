import { fetchRoutes } from '../routeService';
import axios from 'axios';
import polyline from '@mapbox/polyline';
import { getNextShuttleTime, getShuttleTravelTime } from '../shuttleService';
import Config from 'react-native-config';

// Mock the external dependencies
jest.mock('axios');
jest.mock('@mapbox/polyline');
jest.mock('../shuttleService', () => ({
    getNextShuttleTime: jest.fn(),
    getShuttleTravelTime: jest.fn(),
}));
jest.mock('react-native-config', () => ({
    GOOGLE_MAPS_API_KEY: 'mockGoogleMapsApiKey',
}));

describe('fetchRoutes', () => {

    afterEach(jest.resetAllMocks);

    it('should return both transit and shuttle routes and sort them by duration', async () => {

        axios.get.mockResolvedValue({
            data: {
                status: 'OK',
                routes: [
                    {
                        legs: [{ distance: { text: '10 km' }, duration: { text: '30 min' } }],
                    },
                ],
            },
        });
        polyline.decode.mockReturnValue([[1,2]]);
        getNextShuttleTime.mockResolvedValue('2025-02-23T10:00:00Z');
        getShuttleTravelTime.mockResolvedValue({ distance: '5 km', duration: '15 min' });

        const result = await fetchRoutes('origin', 'dest', 'transit');
        expect(result.length).toBe(2); // shuttle + google
    });

    it('should return only Google routes if mode is not "transit"', async () => {


        axios.get.mockResolvedValue({
            data: {
                status: 'OK',
                routes: [
                    {legs: [{ distance: { text: '5 km' }, duration: { text: '10 min' } }],},
                ],
            },
        });

        polyline.decode.mockReturnValue([[1,2]]);

        const result = await fetchRoutes('origin', 'dest', 'driving');

        expect(result.length).toBe(1); // Only 1 Google route
        expect(result[0].duration).toBe('10 min');
    });

    it('should return an empty array if origin or destination is missing', async () => {
        const origin = '';
        const destination = 'Destination';
        const mode = 'transit';
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

        const result = await fetchRoutes(origin, destination, mode);

        expect(result).toEqual([]);
        expect(spy).toHaveBeenCalledWith(`Error fetching ${mode} routes ${origin} to ${destination}`,);

        spy.mockRestore()
    });

    it('should return an empty array if Google API responds with an error', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        axios.get.mockResolvedValue({
            data: { status: 'ERROR', error_message: 'test' },
        });

        const result = await fetchRoutes('origin', 'dest', 'transit');

        expect(result).toEqual([]);
    });

    it('should return an empty array if there is an error fetching the shuttle route', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});

        axios.get.mockResolvedValue({
            data: {
                status: 'OK',
                routes: [
                    {
                        legs: [{ distance: { text: '5 km' }, duration: { text: '10 mins' } }],
                    },
                ],
            },
        });

        polyline.decode.mockReturnValue([[1,2]]);
        getNextShuttleTime.mockReturnValue(new Error('test'));
        // Act
        const result = await fetchRoutes('origin', 'dest', 'transit');

        // Assert
        expect(result.length).toBe(1);
    });
});
