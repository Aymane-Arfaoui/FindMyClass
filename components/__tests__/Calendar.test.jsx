import React from 'react';
import {render, screen, waitFor, userEvent} from '@testing-library/react-native';
import Calendar from '../Calendar';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchBuildingCoordinates } from '@/services/buildingService';

// Mocking external modules
jest.mock('@/services/buildingService', () => ({
    fetchBuildingCoordinates: jest.fn(),
}));

// Sample event data for testing
const sampleEvent = {
    start: { dateTime: '2025-03-16T10:00:00Z' },
    summary: 'Sample Event',
    location: 'Building A, Rm 101',
};

describe('Calendar Component', () => {
    const mockRouterPush = jest.fn();

    beforeEach(() => {
        useRouter.mockReturnValue({
            push: mockRouterPush,
            back: jest.fn(),
        });
        AsyncStorage.getItem.mockResolvedValue(JSON.stringify([sampleEvent]));
        fetchBuildingCoordinates.mockResolvedValue({
            latitude: 43.7,
            longitude: -79.42,
        });
    });

    it('should render the calendar and events', async () => {
        const {getByText, getByTestId} = render(<Calendar events={[sampleEvent]}/>);

        // Verify that calendar is rendered
        const calendar = getByTestId('calendar');
        await waitFor(() => {
            expect(calendar).toBeOnTheScreen();
        });
    });


});
