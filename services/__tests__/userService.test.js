import { getUserInfo, requestLocationPermissions, getUserLocation } from '../userService'; // Adjust the path as necessary
import * as Location from 'expo-location';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {requestForegroundPermissionsAsync} from "expo-location";
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
        const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        fetch.mockRejectedValueOnce(new Error('error'));

        const result = await getUserInfo(mockToken);
        expect(result).toBeNull();
        expect(spy).toHaveBeenCalled();
        spy.mockRestore()

    });
});

describe('requestLocationPermissions', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return false if permission is denied', async () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        requestForegroundPermissionsAsync.mockResolvedValueOnce({
            status: 'denied',
        });

        const result = await requestLocationPermissions();
        expect(result).toBe(false);
        spy.mockRestore()
    });

    it('should return true if permission is granted', async () => {
        requestForegroundPermissionsAsync.mockResolvedValueOnce({
            status: 'granted',
        });

        const result = await requestLocationPermissions();
        expect(result).toBe(true);
    });


});

describe('getUserLocation', () => {
    afterEach(() => {
        jest.clearAllMocks();
        AsyncStorage.clear();
    });

    it('should return user location if permission is granted', async () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const mockLocation = { coords: { latitude:  45.4973, longitude: -73.5788  } };
        Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
        Location.getCurrentPositionAsync.mockResolvedValueOnce(mockLocation);

        const result = await getUserLocation();
        expect(result).toEqual({  lat: 45.4973, lng: -73.5788 });
        spy.mockRestore()
    });

    it('should return fallback location if permission is denied', async () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

        const result = await getUserLocation();
        expect(result).toEqual({ lat: 45.4973, lng: -73.5788 }); // Fallback location

        expect(spy).toHaveBeenCalled();
        spy.mockRestore()
    });

    it('should return fallback location if there is an error fetching location', async () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
        Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
        Location.getCurrentPositionAsync.mockRejectedValueOnce(new Error('Error fetching location'));

        const result = await getUserLocation();
        expect(result).toEqual({ lat: 45.4973, lng: -73.5788 }); // Fallback location
        expect(spy).toHaveBeenCalled();
        spy.mockRestore()
    });
});
