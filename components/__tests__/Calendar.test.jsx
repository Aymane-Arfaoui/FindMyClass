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
            expect(getByText('Sample Event')).toBeOnTheScreen();
        });
    });

    it('should display "Get Directions" button when an event is pressed', async () => {
        render(<Calendar events={[sampleEvent]} />);

        const user=userEvent.setup()
        await user.press(screen.getByText('Sample Event'));

        // Wait for the "Get Directions" button to appear
        await waitFor(() => {
            expect(screen.getByText('Get Directions')).toBeTruthy();
        });
    });

    it('should navigate when "Get Directions" is pressed', async () => {
        render(<Calendar events={[sampleEvent]} />);

        // Simulate selecting the event
        const user=userEvent.setup()
        await user.press(screen.getByText('Sample Event'));

        // Simulate pressing the "Get Directions" button
        await user.press(screen.getByText('Get Directions'));

        // Verify if the router.push was called with the expected URL
        await waitFor(() => {
            expect(mockRouterPush).toHaveBeenCalledWith(
                '/homemap?lat=43.7&lng=-79.42&room=101'
            );
        });
    });

    it('should handle error when no location is available for an event', async () => {
        const warnSpy=jest.spyOn(console, 'warn').mockImplementation(() => {});
        const { getByText } = render(
            <Calendar events={[{ ...sampleEvent, location: null }]} />
        );


        const user=userEvent.setup()
        await user.press(getByText('Sample Event'));

        await user.press( getByText('Get Directions'));

        // Verify that the error message is logged
        await waitFor(() => {
            expect(warnSpy).toHaveBeenCalledWith("No location available for this event.");
        });
    });

    it('should load events from AsyncStorage if propEvents is not provided', async () => {
        AsyncStorage.getItem.mockResolvedValue(JSON.stringify([sampleEvent]));
        render(<Calendar events={[]} />);

        // Check that the event is loaded from AsyncStorage
        await waitFor(() => {
            expect(screen.getByText('Sample Event')).toBeTruthy();
        });
    });
});
