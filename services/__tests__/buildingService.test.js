import axios from 'axios';
import { fetchBuildingCoordinates } from '../buildingService'; // Adjust path as necessary

jest.mock('axios'); // Mock axios for the tests

describe('fetchBuildingCoordinates', () => {

    afterEach(() => {
        jest.clearAllMocks()
    });

    it('should throw an error when location is not provided', async () => {
        expect.assertions(1);
        await expect(fetchBuildingCoordinates(null)).rejects.toThrow('Invalid location string');
    });

    it('should throw an error when location format is invalid', async () => {
        expect.assertions(1);
        const invalidLocation = 'test';
        await expect(fetchBuildingCoordinates(invalidLocation)).rejects.toThrow(`Invalid location format: ${invalidLocation}`);
    });

    it('should throw an error when building name cannot be extracted', async () => {
        expect.assertions(1);
        const invalidLocation = 'test - ';
        await expect(fetchBuildingCoordinates(invalidLocation)).rejects.toThrow(`Building name could not be extracted from location: ${invalidLocation}`);
    });

    it('should throw an error when building name is unknown', async () => {
        expect.assertions(1);
        const invalidLocation = 'test - test ';
        await expect(fetchBuildingCoordinates(invalidLocation)).rejects.toThrow('Unknown building name: "test"');
    });

    // it('should return coordinates from cache if available', async () => {
    //
    //     //write over coordinatesCache
    //     global.coordinatesCache = { "H": { latitude: 1, longitude: 2 } };
    //
    //     const location = 'Montreal - Hall Building Rm 1';
    //     const coordinates = await fetchBuildingCoordinates(location);
    //
    //     expect(coordinates).toEqual({ latitude: 1, longitude: 2 });
    // });
    it('should handle API errors gracefully', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        axios.get.mockRejectedValue(new Error('API call failed'));

        const location = 'Montreal - Hall Building Rm 1';
        await expect(fetchBuildingCoordinates(location)).rejects.toThrow('Failed to fetch building coordinates');
    });

    it('should fetch and return coordinates if not in cache', async () => {
        const mockApiResponse = {
            data: [
                { Building: 'H', Latitude: '1', Longitude: '1' }
            ]
        };

        axios.get.mockResolvedValue(mockApiResponse);

        const location = 'Montreal - Hall Building Rm 1';
        const coordinates = await fetchBuildingCoordinates(location);

        expect(coordinates).toEqual({ latitude: 1, longitude: 1 });
        expect(axios.get).toHaveBeenCalled();

    });



});