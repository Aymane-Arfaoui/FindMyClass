import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getUserInfo = async (token) => {
    if (!token) return null;
    try {
        const response = await fetch("https://www.googleapis.com/userinfo/v2/me",
            {
                headers: {Authorization: `Bearer ${token}`},
            }
        );
        const user = await response.json();
        await AsyncStorage.setItem("@user", JSON.stringify(user));
        return user;
    } catch (error) {
        console.warn(error);
        return null;
    }
}

const FALLBACK_LOCATION = {lat: 45.4973, lng: -73.5788};

let hasRequestedPermission = false;

export const requestLocationPermissions = async () => {
    if (hasRequestedPermission) return true;
    try {
        let {status} = await Location.requestForegroundPermissionsAsync();
        hasRequestedPermission = true;
        return status === 'granted';
    } catch (error) {
        console.error("Error requesting location permissions:", error);
        return false;
    }
};

export const getUserLocation = async () => {
    try {
        const {status} = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.error('Permission denied');
            return FALLBACK_LOCATION;
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        return {lat: location.coords.latitude, lng: location.coords.longitude};
    } catch (error) {
        console.error('Error fetching location:', error);
        return FALLBACK_LOCATION;
    }
};

export const getUserLocationArray = async () => {
    try {
        const {status} = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.error('Permission denied');
            return FALLBACK_LOCATION;
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        return {lat: location.coords.latitude, lng: location.coords.longitude};
    } catch (error) {
        console.error('Error fetching location:', error);
        return FALLBACK_LOCATION;
    }
};
