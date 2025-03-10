import React from 'react';
import {render, screen, userEvent, waitFor} from '@testing-library/react-native';
import MapScreen from '../MapScreen'; // Path to your MapScreen component
import { useNavigation, useRoute } from '@react-navigation/native';


jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));
jest.mock('react-native-gesture-handler', () => ({
    GestureHandlerRootView: ({ children }) => <>{children}</>,
    PinchGestureHandler: ({ children }) => <>{children}</>,
}));


describe('MapScreen', () => {

    it('should display text when no data is available', async () => {
        useRoute.mockReturnValue({ params: { buildingKey: 'test' } });
       render(<MapScreen />);
        await waitFor(() => {
            expect(screen.getByText(' No indoor map data available for this building.')).toBeOnTheScreen();
        });
    });

    it('should display an svg  when building is available', async () => {
        useRoute.mockReturnValue({ params: { buildingKey: 'Hall' } });
        render(<MapScreen />);
        await waitFor(() => {
            expect(screen.getByTestId('svg-image')).toBeOnTheScreen();
        });
    });
    it('should display a section panel when a section is pressed', async () => {
        useRoute.mockReturnValue({ params: { buildingKey: 'Hall' } });
        render(<MapScreen />);
        const user=userEvent.setup()
        await user.press(screen.getByTestId('section-5'));
        await waitFor(() => {
            expect(screen.getByTestId('section-panel')).toBeOnTheScreen();
        });
    });

    it('should show a different number of sections for each floor', async () => {
        useRoute.mockReturnValue({ params: { buildingKey: 'Hall' } });
        render(<MapScreen />);
        const user=userEvent.setup()

        await waitFor(async () => {
            expect(screen.getByTestId('section-45')).toBeOnTheScreen();//
            await user.press(screen.getByTestId('floor-2-button'));
            expect(screen.queryByTestId('section-45')).toBeNull();//
        });
    });
});

