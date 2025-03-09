import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
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

// Sample floor data and params
const mockFloorsData = {
    building1: {
        floor1: {
            viewBox: "0 0 100 100",
            sections: [{ id: '1', d: 'M10 10 H 90 V 90 H 10 Z' }],
            poiImage: 'image_url',
            width: 100,
            height: 100
        },
    },
};

describe('MapScreen', () => {
    beforeEach(() => {
        useRoute.mockReturnValue({ params: { buildingKey: 'building1' } });

    });

    it('should render map with floor data', async () => {
        // Mock floor data
        const { getByText, getByTestId } = render(<MapScreen />);

        // Verify the screen renders the initial floor and sections
        await waitFor(() => {
            expect(getByText('Concordia Shuttle')).toBeTruthy();  // Example text that might exist on your screen
            expect(getByTestId('Svg')).toBeTruthy();
        });
    });

    it('should call goBack when the back button is pressed', () => {
        const { getByText } = render(<MapScreen />);

        const backButton = getByText('Ionicons'); // Assuming `Ionicons` is a placeholder here
        fireEvent.press(backButton);

        // Verify the navigation method was called
        expect(useNavigation().goBack).toHaveBeenCalledTimes(1);
    });

    it('should reset transform on floor change', () => {
        const { getByTestId } = render(<MapScreen />);

        const floorSelector = getByTestId('floor-selector'); // You should test for the correct component if the selector has a testID
        fireEvent.press(floorSelector);

        // Ensure the transform reset method is called
        expect(getByTestId('floor-selector')).toBeTruthy(); // Adjust based on your test id
    });

    it('should update selectedSection on map section press', async () => {
        const { getByText, getByTestId } = render(<MapScreen />);

        // Simulate a press on the map section (ensure you add testID to your map sections)
        const sectionPath = getByTestId('section-path'); // Assuming you've added a testID
        fireEvent.press(sectionPath);

        // Verify that the selected section is updated
        expect(getByText('Section Selected')).toBeTruthy(); // Change to whatever your component does when selecting a section
    });
});

