import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import MapScreen from '../MapScreen'; // Path to your MapScreen component
import { useNavigation, useRoute } from '@react-navigation/native';
jest.mock('react-native-svg', () => ({
    Svg: 'Svg',
    Rect: 'Rect',
    Path: 'Path',
    Image: 'Image',
}));

jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));


describe('MapScreen', () => {
    beforeEach(() => {
        useRoute.mockReturnValue({ params: { buildingKey: 'test' } });

    });

    it('should display text when no data is available', async () => {
       render(<MapScreen />);
        await waitFor(() => {
            expect(screen.getByText(' No indoor map data available for this building.')).toBeOnTheScreen();
        });
    });

});

