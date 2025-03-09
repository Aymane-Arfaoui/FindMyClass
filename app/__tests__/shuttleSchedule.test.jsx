import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ShuttleSchedule from '../ShuttleSchedule';  // Adjust the import path if necessary
import { getShuttleTimes } from '@/services/shuttleService';
import { useRouter } from 'expo-router';

// Mocking the services and hooks
jest.mock('@/services/shuttleService', () => ({
    getShuttleTimes: jest.fn(),
}));


 // Mocking FontAwesome Icons
jest.mock('expo-status-bar', () => ({
    StatusBar: jest.fn(),
}));

describe('ShuttleSchedule Component', () => {
    const mockRouter = { back: jest.fn() };

    beforeEach(() => {
        // Reset mocks before each test
        useRouter.mockReturnValue(mockRouter);
    });

    it('should render shuttle times and show error if no shuttles are available', async () => {
        // Mock getShuttleTimes to return mock data
        getShuttleTimes.mockReturnValue({
            nextShuttles: ['10:00', '11:00', '12:00'],
            allShuttles: [
                { time: '08:00', shuttleTime: 480 },
            ],
        });

        // Render the component
        render(<ShuttleSchedule />);

        expect(screen.getByText('Departed at 08:00')).toBeTruthy();
    });

    it('should show an error message if no shuttles are available', async () => {
        // Mock getShuttleTimes to return no shuttles
        getShuttleTimes.mockReturnValue({
            nextShuttles: [],
            allShuttles: [],
        });

        // Render the component
        render(<ShuttleSchedule />);

        // Wait for error message to appear
        await waitFor(() => {
            expect(screen.getByText('No more shuttles available today.')).toBeTruthy();
        });
    });

    it('should handle back navigation when back button is pressed', async () => {
        // Mock getShuttleTimes to return mock data
        getShuttleTimes.mockReturnValue({
            nextShuttles: ['10:00', '11:00'],
            allShuttles: [
                { time: '09:00', shuttleTime: 540 },
            ],
        });

        // Render the component
        render(<ShuttleSchedule />);

        // Simulate a press on the back button
        fireEvent.press(screen.getByTestId('back-button'));

        // Check if the router back function was called
        expect(mockRouter.back).toHaveBeenCalledTimes(1);
    });


});
