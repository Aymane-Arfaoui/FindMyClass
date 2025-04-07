
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Map from '../Map';

jest.mock('@rnmapbox/maps', () => {
    return {
        MapView: jest.fn().mockImplementation(() => null),
        Camera: jest.fn().mockImplementation(() => null),
        ShapeSource: jest.fn().mockImplementation(({ children }) => <>{children}</>),
        FillLayer: jest.fn().mockImplementation(() => null),
        SymbolLayer: jest.fn().mockImplementation(() => null),
        LineLayer: jest.fn().mockImplementation(() => null),
        PointAnnotation: jest.fn().mockImplementation(({ children }) => <>{children}</>),
        CircleLayer: jest.fn().mockImplementation(() => null),
        setAccessToken: jest.fn(),
    };
});
jest.mock('@expo/vector-icons', () => {
    return {
        Ionicons: (name,size,color)=><>{name}</>

    };
});
describe('Map Component', () => {
    const mockOnBuildingPress = jest.fn();
    const mockOnMapPress = jest.fn();
    const mockOnRoutePress = jest.fn();
    const mockOnSelectedPOI = jest.fn();

    const cameraRef = { current: { flyTo: jest.fn(), setCamera: jest.fn() } };

    const selectedLocation = [45.4215, -75.6972]; // Example coordinates (Ottawa)
    const userLocation = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [45.4215, -75.6972], // Example user location
                },
            },
        ],
    };

    const routes = [
        {
            routeGeoJSON: {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [45.4215, -75.6972],
                                [45.4216, -75.6973],
                            ],
                        },
                    },
                ],
            },
        },
    ];

    const selectedRoute = routes[0];

    const places = [
        {
            category: 'location',
            geometry: { coordinates: [45.4215, -75.6972] },
        },
        {
            category: 'atm',
            geometry: { coordinates: [45.4215, -75.6972] },
        },
        {
            category: 'restaurant',
            geometry: { coordinates: [45.4215, -75.6972] },
        },
        {
            category: 'cafe',
            geometry: { coordinates: [45.4216, -75.6973] },
        },
    ];

    test('should render MapView with correct camera configuration', () => {
        const { getByTestId } = render(
            <Map
                onBuildingPress={mockOnBuildingPress}
                selectedLocation={selectedLocation}
                userLocation={userLocation}
                centerCoordinate={selectedLocation}
                routes={routes}
                selectedRoute={selectedRoute}
                onMapPress={mockOnMapPress}
                cameraRef={cameraRef}
                onRoutePress={mockOnRoutePress}
                places={places}
                onSelectedPOI={mockOnSelectedPOI}
            />
        );

        expect(cameraRef.current.setCamera).toHaveBeenCalledWith(expect.objectContaining ({centerCoordinate:selectedLocation}));
    });

});
