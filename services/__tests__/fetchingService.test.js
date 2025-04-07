import { fetchPoI, fetchPlacesOfInterest, fetchBuildingData, fetchRoutesData, fetchDirections,fetchAllModesData} from '@/services/fetchingService';
import { fetchRoutes } from '@/services/routeService';
import {Alert} from "react-native"; // If fetchRoutes is directly imported, mock it too.
const mockApiKey='fake-api-key'
jest.mock('react-native-config', () => ({
    GOOGLE_PLACES_API_KEY: 'fake-api-key',
}));

// Mock the fetch API
global.fetch = jest.fn();

// Mock the fetchRoutes function if it's necessary to test `fetchRoutesData` function
jest.mock('@/services/routeService', () => ({
    fetchRoutes: jest.fn(),
}));
jest.spyOn(console, 'error').mockImplementation(() => {});


describe('fetchingService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

describe('fetchAllModesData', () => {
    const originStr = '45.4960,-73.5789';
    const destinationStr = '45.4970,-73.5790';
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch data for all modes', async () => {
        const mockResponse = {
            routes: [{
                legs: [{
                    duration: '300s'
                }]
            }]
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockResponse)
        }).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockResponse)
        }).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockResponse)
        }).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockResponse)
        });

        const result = await fetchAllModesData(originStr, destinationStr);

        expect(fetch).toHaveBeenCalledTimes(4);
        expect(result).toEqual({
            DRIVE: '5 min',
            TRANSIT: '5 min',
            WALK: '5 min',
            BICYCLE: '5 min'
        });
    });

    it('should handle API errors gracefully', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: () => Promise.resolve('Server error')
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ routes: [] })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    routes: [{
                        legs: [{
                            duration: '600s'
                        }]
                    }]
                })
            });

        const result = await fetchAllModesData(originStr, destinationStr);

        expect(result).toEqual({
            DRIVE: 'N/A',
            TRANSIT: 'N/A',
            WALK: 'N/A',
            BICYCLE: '10 min'
        });
    });

    it('should add traffic awareness for DRIVE mode', async () => {
        const mockResponse = {
            routes: [{
                legs: [{
                    duration: '300s'
                }]
            }]
        };

        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResponse)
        });

        await fetchAllModesData(originStr, destinationStr);

        const driveCall = fetch.mock.calls.find(call =>
            JSON.parse(call[1].body).travelMode === 'DRIVE'
        );
        expect(JSON.parse(driveCall[1].body)).toHaveProperty('routingPreference', 'TRAFFIC_AWARE');
    });
});

describe('fetchRoutesData', () => {
    const mockSetLoading = jest.fn();
    const mockSetRoutes = jest.fn();
    const mockSetFastestRoute = jest.fn();
    const origin = '45.4960,-73.5789';
    const destination = '45.4970,-73.5790';
    const mode = 'WALK';

    beforeEach(() => {
        mockSetLoading.mockClear();
        mockSetRoutes.mockClear();
        mockSetFastestRoute.mockClear();
    });

    it('should fetch and sort routes', async () => {
        const mockRoutes = [
            { duration: '300', distance: '500' },
            { duration: '200', distance: '400' }
        ];
        fetchRoutes.mockResolvedValue(mockRoutes);

        await fetchRoutesData(
            origin,
            destination,
            mode,
            mockSetLoading,
            mockSetRoutes,
            mockSetFastestRoute
        );

        expect(mockSetLoading).toHaveBeenCalledWith(true);
        expect(fetchRoutes).toHaveBeenCalledWith(origin, destination, mode);
        expect(mockSetRoutes).toHaveBeenCalledWith([
            { duration: '200', distance: '400' },
            { duration: '300', distance: '500' }
        ]);
        expect(mockSetFastestRoute).toHaveBeenCalledWith({ duration: '200', distance: '400' });
        expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('should handle empty response', async () => {
        fetchRoutes.mockResolvedValue([]);

        await fetchRoutesData(
            origin,
            destination,
            mode,
            mockSetLoading,
            mockSetRoutes,
            mockSetFastestRoute
        );

        expect(mockSetRoutes).toHaveBeenCalledWith([]);
        expect(mockSetFastestRoute).toHaveBeenCalledWith(null);
    });

    it('should handle errors', async () => {
        fetchRoutes.mockRejectedValue(new Error('API error'));

        await fetchRoutesData(
            origin,
            destination,
            mode,
            mockSetLoading,
            mockSetRoutes,
            mockSetFastestRoute
        );

        expect(mockSetRoutes).toHaveBeenCalledWith([]);
        expect(mockSetFastestRoute).toHaveBeenCalledWith(null);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
    });
});

describe('fetchDirections', () => {
    const mockOrigin = {
        geometry: {
            coordinates: [-73.5789, 45.4960]
        }
    };
    const mockDest = {
        geometry: {
            coordinates: [-73.5790, 45.4970]
        }
    };
    const mockSetTravelTimes = jest.fn();
    const mockSetIsDirectionsView = jest.fn();
    const mockSetLoading = jest.fn();
    const mockSetRoutes = jest.fn();
    const mockSetFastestRoute = jest.fn();
    const mode = 'WALK';

    beforeEach(() => {
        jest.clearAllMocks();
        fetchRoutes.mockResolvedValue([{ duration: '300', distance: '500' }]);
        global.fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                routes: [{
                    legs: [{
                        duration: '300s'
                    }]
                }]
            })
        });
    });

    it('should fetch directions successfully', async () => {
        await fetchDirections(
            mockOrigin,
            mockDest,
            mode,
            mockSetTravelTimes,
            mockSetIsDirectionsView,
            mockSetLoading,
            mockSetRoutes,
            mockSetFastestRoute
        );

        expect(mockSetLoading).toHaveBeenCalledWith(true);
        expect(mockSetTravelTimes).toHaveBeenCalled();
        expect(mockSetIsDirectionsView).toHaveBeenCalledWith(true);
        expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('should handle missing coordinates', async () => {
        await fetchDirections(
            { geometry: {} },
            { geometry: {} },
            mode,
            mockSetTravelTimes,
            mockSetIsDirectionsView,
            mockSetLoading,
            mockSetRoutes,
            mockSetFastestRoute
        );

        expect(mockSetLoading).toHaveBeenCalledWith(false);
        expect(mockSetTravelTimes).not.toHaveBeenCalled();
    });

    it('should handle errors in fetchAllModesData', async () => {
        global.fetch.mockRejectedValue(new Error('API error'));

        await fetchDirections(
            mockOrigin,
            mockDest,
            mode,
            mockSetTravelTimes,
            mockSetIsDirectionsView,
            mockSetLoading,
            mockSetRoutes,
            mockSetFastestRoute
        );

        expect(console.error).toHaveBeenCalledWith("Failed to fetch DRIVE: API error");
    });

    it('should handle errors in fetchRoutesData', async () => {
        fetchRoutes.mockRejectedValue(new Error('Route error'));

        await fetchDirections(
            mockOrigin,
            mockDest,
            mode,
            mockSetTravelTimes,
            mockSetIsDirectionsView,
            mockSetLoading,
            mockSetRoutes,
            mockSetFastestRoute
        );

        expect(mockSetRoutes).toHaveBeenCalledWith([]);
        expect(mockSetFastestRoute).toHaveBeenCalledWith(null);
    });
});
describe('fetchPlacesOfInterest', () => {
    beforeEach(() => {
        fetch.mockClear();
    });
    const mockPlacesResponse = {
        places: [
            {
                id: 'place1',
                displayName: { text: 'Café Test' },
                location: { longitude: -73.579, latitude: 45.497 }
            },
            {
                id: 'place2',
                displayName: { text: 'Library Test' },
                location: { longitude: -73.578, latitude: 45.496 }
            }
        ]
    };

    const mockSetIsFetchingPlaces = jest.fn();
    const mockSetPlaces = jest.fn();
    const mockCurrentLocation = {
        geometry: {
            coordinates: [-73.5789, 45.4960]
        }
    };

    it('should not fetch if no currentLocation', async () => {
        await fetchPlacesOfInterest(
            'cafe',
            null,
            false,
            mockSetIsFetchingPlaces,
            mockSetPlaces
        );

        expect(fetch).not.toHaveBeenCalled();
    });

    it('should not fetch if already fetching', async () => {
        await fetchPlacesOfInterest(
            'cafe',
            mockCurrentLocation,
            true,
            mockSetIsFetchingPlaces,
            mockSetPlaces
        );

        expect(fetch).not.toHaveBeenCalled();
    });

    it('should not fetch if invalid coordinates', async () => {
        await fetchPlacesOfInterest(
            'cafe',
            { geometry: { coordinates: [] } },
            false,
            mockSetIsFetchingPlaces,
            mockSetPlaces
        );

        expect(fetch).not.toHaveBeenCalled();
        expect(mockSetIsFetchingPlaces).toHaveBeenCalledWith(false);
    });

    it('should make API call with correct parameters', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockPlacesResponse)
        });

        await fetchPlacesOfInterest(
            'cafe',
            mockCurrentLocation,
            false,
            mockSetIsFetchingPlaces,
            mockSetPlaces
        );

        expect(fetch).toHaveBeenCalledWith(
            'https://places.googleapis.com/v1/places:searchNearby',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': mockApiKey,
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.location'
                },
                body: JSON.stringify({
                    includedTypes: ['cafe'],
                    maxResultCount: 10,
                    locationRestriction: {
                        circle: {
                            center: { latitude: 45.4960, longitude: -73.5789 },
                            radius: 1000
                        }
                    }
                })
            }
        );
    });

    it('should set places on successful response', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockPlacesResponse)
        });

        await fetchPlacesOfInterest(
            'cafe',
            mockCurrentLocation,
            false,
            mockSetIsFetchingPlaces,
            mockSetPlaces
        );

        expect(mockSetPlaces).toHaveBeenCalledWith([
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [-73.579, 45.497]
                },
                name: 'Café Test',
                place_id: 'place1',
                category: 'cafe'
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [-73.578, 45.496]
                },
                name: 'Library Test',
                place_id: 'place2',
                category: 'cafe'
            }
        ]);
    });

    it('should handle empty places response', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ places: [] })
        });

        await fetchPlacesOfInterest(
            'cafe',
            mockCurrentLocation,
            false,
            mockSetIsFetchingPlaces,
            mockSetPlaces
        );

        expect(mockSetPlaces).toHaveBeenCalledWith([]);
    });

    it('should handle API error', async () => {
        fetch.mockRejectedValueOnce(new Error('API error'));

        await fetchPlacesOfInterest(
            'cafe',
            mockCurrentLocation,
            false,
            mockSetIsFetchingPlaces,
            mockSetPlaces
        );

        expect(mockSetIsFetchingPlaces).toHaveBeenCalledWith(false);
    });

    it('should always set isFetching to false in finally', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockPlacesResponse)
        });

        await fetchPlacesOfInterest(
            'cafe',
            mockCurrentLocation,
            false,
            mockSetIsFetchingPlaces,
            mockSetPlaces
        );

        expect(mockSetIsFetchingPlaces).toHaveBeenCalledWith(false);
    });
});

describe('fetchPoI', () => {
    const mockSetBuildingDetails = jest.fn();
    const mockPlace = {
        place_id: 'place1'
    };
    const mockPlaceDetailsResponse = {
        displayName: { text: 'Café Test' },
        formattedAddress: '123 Test St, Montreal',
        photos: [{ name: 'photo1' }]
    };
    beforeEach(() => {
        fetch.mockClear();
        mockSetBuildingDetails.mockClear();
    });

    it('should make API call with correct parameters', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockPlaceDetailsResponse)
        });

        await fetchPoI(mockPlace, mockSetBuildingDetails);

        expect(fetch).toHaveBeenCalledWith(
            'https://places.googleapis.com/v1/places/place1',
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': mockApiKey,
                    'X-Goog-FieldMask': 'displayName,formattedAddress,photos'
                }
            }
        );
    });

    it('should set building details on successful response', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockPlaceDetailsResponse)
        });

        await fetchPoI(mockPlace, mockSetBuildingDetails);

        expect(mockSetBuildingDetails).toHaveBeenCalledWith({
            displayName: { text: 'Café Test' },
            formattedAddress: '123 Test St, Montreal',
            photos: [{ name: 'photo1' }]
        });
    });

    it('should handle empty response', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({})
        });

        await fetchPoI(mockPlace, mockSetBuildingDetails);

        expect(mockSetBuildingDetails).toHaveBeenCalledWith({});
    });

    it('should handle API error', async () => {
        fetch.mockRejectedValueOnce(new Error('API error'));

        await fetchPoI(mockPlace, mockSetBuildingDetails);

        expect(mockSetBuildingDetails).not.toHaveBeenCalled();
    });
});

    describe('fetchBuildingData', () => {
        const mockSetLoading = jest.fn();
        const mockSetLastFetchedPlaceId = jest.fn();
        const mockSetBuildingDetails = jest.fn();
        const mockSetSelectedLocation = jest.fn();

        beforeEach(() => {
            jest.clearAllMocks();
            fetch.mockReset();
        });

        it('should return early if no building or coordinates provided', async () => {
            await fetchBuildingData(
                null,
                null,
                null,
                mockSetLoading,
                null,
                mockSetLastFetchedPlaceId,
                mockSetBuildingDetails,
                mockSetSelectedLocation
            );

            expect(mockSetLoading).toHaveBeenCalledWith(false);
            expect(fetch).not.toHaveBeenCalled();
        });

        it('should return early if same building was fetched before', async () => {
            const mockBuilding = {
                name: 'test-building',
                textPosition: [-73.579, 45.497]
            };

            await fetchBuildingData(
                mockBuilding,
                null,
                null,
                mockSetLoading,
                'test-building',
                mockSetLastFetchedPlaceId,
                mockSetBuildingDetails,
                mockSetSelectedLocation
            );

            expect(mockSetLoading).toHaveBeenCalledWith(false);
            expect(fetch).not.toHaveBeenCalled();
        });

        it('should fetch place ID for building', async () => {
            const mockBuilding = {
                name: 'test-building',
                textPosition: [-73.579, 45.497]
            };

            const mockPlaceSearchResponse = {
                places: [{ id: 'test-place-id' }]
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockPlaceSearchResponse)
            });

            await fetchBuildingData(
                mockBuilding,
                null,
                null,
                mockSetLoading,
                null,
                mockSetLastFetchedPlaceId,
                mockSetBuildingDetails,
                mockSetSelectedLocation
            );

            expect(fetch).toHaveBeenCalledWith(
                'https://places.googleapis.com/v1/places:searchText',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': mockApiKey,
                        'X-Goog-FieldMask': 'places.id'
                    },
                    body: JSON.stringify({
                        textQuery: 'test-building',
                        locationBias: {
                            circle: {
                                center: {
                                    latitude: 45.497,
                                    longitude: -73.579
                                },
                                radius: 2000.0
                            }
                        },
                        pageSize: 1
                    })
                }
            );

            expect(mockSetLastFetchedPlaceId).toHaveBeenCalledWith('test-place-id');
        });

        it('should fetch building details when place ID is available', async () => {
            const mockBuilding = {
                name: 'test-building',
                textPosition: [-73.579, 45.497]
            };

            const mockPlaceDetailsResponse = {
                displayName: { text: 'Test Building' },
                formattedAddress: '123 Test St',
                primaryType: 'university',
                googleMapsUri: 'https://maps.test',
                photos: []
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ places: [{ id: 'test-place-id' }] })
            }).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockPlaceDetailsResponse)
            });

            await fetchBuildingData(
                mockBuilding,
                null,
                null,
                mockSetLoading,
                null,
                mockSetLastFetchedPlaceId,
                mockSetBuildingDetails,
                mockSetSelectedLocation
            );

            expect(fetch).toHaveBeenCalledTimes(2);
            expect(fetch).toHaveBeenLastCalledWith(
                'https://places.googleapis.com/v1/places/test-place-id',
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': mockApiKey,
                        'X-Goog-FieldMask': 'displayName,formattedAddress,primaryType,googleMapsUri,photos'
                    }
                }
            );

            expect(mockSetBuildingDetails).toHaveBeenCalledWith(mockPlaceDetailsResponse);
        });

        it('should handle API errors when fetching place ID', async () => {
            const mockBuilding = {
                name: 'test-building',
                textPosition: [-73.579, 45.497]
            };

            fetch.mockRejectedValueOnce(new Error('API error'));

            await fetchBuildingData(
                mockBuilding,
                null,
                null,
                mockSetLoading,
                null,
                mockSetLastFetchedPlaceId,
                mockSetBuildingDetails,
                mockSetSelectedLocation
            );

            expect(fetch).toHaveBeenCalledTimes(1);
            expect(mockSetBuildingDetails).not.toHaveBeenCalled();
        });

        it('should handle API errors when fetching building details', async () => {
            const mockBuilding = {
                name: 'test-building',
                textPosition: [-73.579, 45.497]
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ places: [{ id: 'test-place-id' }] })
            }).mockRejectedValueOnce(new Error('API error'));

            await fetchBuildingData(
                mockBuilding,
                null,
                null,
                mockSetLoading,
                null,
                mockSetLastFetchedPlaceId,
                mockSetBuildingDetails,
                mockSetSelectedLocation
            );

            expect(fetch).toHaveBeenCalledTimes(2);
            expect(mockSetBuildingDetails).toHaveBeenCalledWith(null);
        });

        it('should set selected location with coordinates when no building provided', async () => {
            await fetchBuildingData(
                null,
                -73.579,
                45.497,
                mockSetLoading,
                null,
                mockSetLastFetchedPlaceId,
                mockSetBuildingDetails,
                mockSetSelectedLocation
            );

            expect(mockSetSelectedLocation).toHaveBeenCalledWith({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [-73.579, 45.497]
                },
                name: 'Unknown Location'
            });
        });

        it('should set selected location with building name when provided', async () => {
            const mockBuilding = {
                name: 'test-building',
                textPosition: [-73.579, 45.497]
            };

            fetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ places: [] })
            });

            await fetchBuildingData(
                mockBuilding,
                null,
                null,
                mockSetLoading,
                null,
                mockSetLastFetchedPlaceId,
                mockSetBuildingDetails,
                mockSetSelectedLocation
            );

            expect(mockSetSelectedLocation).toHaveBeenCalledWith({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [-73.579, 45.497]
                },
                name: 'test-building'
            });
        });

        it('should use provided coordinates when building has no textPosition', async () => {
            const mockBuilding = {
                name: 'test-building'
            };

            await fetchBuildingData(
                mockBuilding,
                -73.579,
                45.497,
                mockSetLoading,
                null,
                mockSetLastFetchedPlaceId,
                mockSetBuildingDetails,
                mockSetSelectedLocation
            );

            expect(mockSetSelectedLocation).toHaveBeenCalledWith({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [-73.579, 45.497]
                },
                name: 'test-building'
            });
        });
    });
});