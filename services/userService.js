import React from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getUserInfo = async (token) => {
    if(!token) return null;
    try{
      const response = await fetch("https://www.googleapis.com/userinfo/v2/me",
      { 
            headers : {Authorization: `Bearer ${token}`},
      }
    );
    const user = await response.json();
    await AsyncStorage.setItem("@user", JSON.stringify(user));
    return user;
    }catch(error){
      console.log(error);
      return null;
    }
  }

const FALLBACK_LOCATION = { lat: 45.4973, lng: -73.5788 }; // hall

let hasRequestedPermission = false; // prevents asking for permissions many times

export const requestLocationPermissions = async () => {
    if (hasRequestedPermission) return true; // already asked, doesnt need to be asked again
    try {
        let { status } = await Location.requestForegroundPermissionsAsync(); // use location while the app is open
        hasRequestedPermission = true;
        return status === 'granted';
    } catch (error) {
        console.error("Error requesting location permissions:", error);
        return false;
    }
};

export const getUserLocation = async () => {
    try {
        const hasPermission = await requestLocationPermissions();
        if (!hasPermission) return FALLBACK_LOCATION; // if user denies the location then uses the fallback

        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }); // get thelocation with high accuracy
        const userLocation = { lat: location.coords.latitude, lng: location.coords.longitude };

        await AsyncStorage.setItem("@userLocation", JSON.stringify(userLocation)); //saving the location locally
        return userLocation;
    } catch (error) {
        console.error("Error fetching location:", error);
        return FALLBACK_LOCATION;
    }
};