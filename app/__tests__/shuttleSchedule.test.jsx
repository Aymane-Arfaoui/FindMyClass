import React from 'react';
import {render, screen, waitFor, userEvent} from '@testing-library/react-native';
import ShuttleSchedule from '../shuttleSchedule.jsx';
import { getShuttleTimes } from '@/services/shuttleService';
import { useRouter } from 'expo-router';

jest.mock('@/services/shuttleService', () => ({
    getShuttleTimes: jest.fn(),
}));

jest.mock('expo-status-bar', () => ({
    StatusBar: jest.fn(),
}));

describe('ShuttleSchedule Component', () => {
    const mockRouter = { back: jest.fn() };

    beforeEach(() => {
        useRouter.mockReturnValue(mockRouter);
    });

    it('should render shuttle component', async () => {
        getShuttleTimes.mockReturnValue({
            nextShuttles: ['10:00', '11:00', '12:00'],
            allShuttles: [
                { time: '08:00', shuttleTime: 480 },
            ],
        });

        render(<ShuttleSchedule />);
        await waitFor(() => {
            expect(screen.getByText('Concordia Shuttle')).toBeTruthy();
        });
    });

    it('should show an error message if no shuttles are available', async () => {
        getShuttleTimes.mockReturnValue({
            nextShuttles: [],
            allShuttles: [],
        });

        render(<ShuttleSchedule />);

        await waitFor(() => {
            expect(screen.getByText('No more shuttles available today.')).toBeTruthy();
        });
    });

    it('should handle back navigation when back button is pressed', async () => {
        getShuttleTimes.mockReturnValue({
            nextShuttles: ['10:00', '11:00'],
            allShuttles: [
                { time: '09:00', shuttleTime: 540 },
            ],
        });

        render(<ShuttleSchedule />);
        const user=userEvent.setup();
        await user.press(screen.getByTestId('back-button'));

        expect(mockRouter.back).toHaveBeenCalledTimes(1);
    });


});
