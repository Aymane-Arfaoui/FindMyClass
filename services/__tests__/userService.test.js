import { getUserInfo, requestLocationPermissions, getUserLocation } from '../userService'; // Adjust the path as necessary
import * as Location from 'expo-location';
import AsyncStorage from "@react-native-async-storage/async-storage";
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock') );

fetch = jest.fn();

jest.mock('expo-location', () => ({
    requestForegroundPermissionsAsync: jest.fn(),
    getCurrentPositionAsync: jest.fn(),
}));

describe('getUserInfo', () => {
    const mockToken = 'mock_token';

    afterEach(() => {
        jest.clearAllMocks();
        AsyncStorage.clear();
    });

    it('should return user info if the request is successful', async () => {
        const mockUser = { name: 'Test'};
        fetch.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce(mockUser),
        });
        const result = await getUserInfo(mockToken);
        expect(result).toEqual(mockUser);
    });

    it('should return null if no token is provided', async () => {
        const result = await getUserInfo(null);
        expect(result).toBeNull();
    });

    it('should return null if the request fails', async () => {
        fetch.mockRejectedValueOnce(new Error('error'));

        const result = await getUserInfo(mockToken);
        expect(result).toBeNull();

    });
});

describe('requestLocationPermissions', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return true if permission is granted', async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
            status: 'granted',
        });

        const result = await requestLocationPermissions();
        expect(result).toBe(true);
    });

    it('should return false if permission is denied', async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({
            status: 'denied',
        });

        const result = await requestLocationPermissions();
        expect(result).toBe(false);
    });

});

describe('getUserLocation', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return user location if permission is granted', async () => {
        const mockLocation = { coords: { latitude:  45.4973, longitude: -73.5788  } };
        Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
        Location.getCurrentPositionAsync.mockResolvedValueOnce(mockLocation);

        const result = await getUserLocation();
        expect(result).toEqual({  lat: 45.4973, lng: -73.5788 });
    });

    it('should return fallback location if permission is denied', async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

        const result = await getUserLocation();
        expect(result).toEqual({ lat: 45.4973, lng: -73.5788 }); // Fallback location
    });

    it('should return fallback location if there is an error fetching location', async () => {
        Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
        Location.getCurrentPositionAsync.mockRejectedValueOnce(new Error('Error fetching location'));

        const result = await getUserLocation();
        expect(result).toEqual({ lat: 45.4973, lng: -73.5788 }); // Fallback location
    });
});
