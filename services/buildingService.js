import axios from 'axios';
import {buildingNameToCodeMap} from "@/constants/buildingsMapping";

const API_BASE_URL = 'http://127.0.0.1:3001/api/buildinglist';
const coordinatesCache = {};

export const fetchBuildingCoordinates = async (location) => {
    if (!location) throw new Error("Invalid location string");

    const locationParts = location.split(' - ');
    if (locationParts.length < 2) {
        throw new Error(`Invalid location format: ${location}`);
    }

    const buildingName = locationParts[1].split('Rm')[0].trim();
    if (!buildingName) {
        throw new Error(`Building name could not be extracted from location: ${location}`);
    }

    const buildingCode = buildingNameToCodeMap[buildingName];
    if (!buildingCode) {
        throw new Error(`Unknown building name: "${buildingName}"`);
    }

    if (coordinatesCache[buildingCode]) {
        return coordinatesCache[buildingCode];
    }

    try {
        const response = await axios.get(API_BASE_URL);
        const buildings = response.data;

        const building = buildings.find(b => b.Building === buildingCode);
        if (!building) {
            throw new Error(`Building code "${buildingCode}" not found.`);
        }

        const coordinates = {
            latitude: parseFloat(building.Latitude),
            longitude: parseFloat(building.Longitude)
        };
        coordinatesCache[buildingCode] = coordinates;
        return coordinates;

    } catch (error) {
        console.error('Failed to fetch building coordinates:', error.message);
        throw new Error('Failed to fetch building coordinates');
    }
};
