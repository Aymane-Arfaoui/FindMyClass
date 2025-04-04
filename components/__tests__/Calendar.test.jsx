import React from 'react';
import {render, screen, waitFor, userEvent} from '@testing-library/react-native';
import Calendar from '../Calendar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchBuildingCoordinates } from '@/services/buildingService';
import { calendarService } from '@/services/calendarService';
import { useRouter } from 'expo-router';

jest.mock('@/services/calendarService', () =>  ({
    calendarService:{
        fetchAndUpdateEvents: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),},
}));

jest.mock('@/services/buildingService', () => ({
    fetchBuildingCoordinates: jest.fn(),
}));



describe('Calendar Component', () => {
    const mockBack = jest.fn();
    const mockPush = jest.fn();

    const mockDate = new Date();
    mockDate.setHours(10);
    mockDate.setMinutes(0);
    mockDate.setSeconds(0);
    mockDate.setMilliseconds(0);

    const mockEvents = [{ id: 1, location: 'Hall Building Rm 101', start: { dateTime: mockDate }, summary: 'Test Event' }];

    beforeEach(() => {
        jest.clearAllMocks();
        useRouter.mockReturnValue({
            back:mockBack,
            push:mockPush
        })
    });

    it('renders the calendar component and shows the header', async () => {
        render(<Calendar events={mockEvents}/>);


        await waitFor(() => {
            expect(screen.getByText('Calendar')).toBeOnTheScreen();
            expect(screen.getByTestId('calendar')).toBeOnTheScreen();
        });

    });

    it('loads events from AsyncStorage on mount', async () => {
        AsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockEvents));

        render(<Calendar events={[]} />);

        await waitFor(() => {
            expect(screen.getByText('10:00 AM')).toBeTruthy();
        });
    });

    it('refreshes events when refresh button is pressed', async () => {
        calendarService.fetchAndUpdateEvents.mockResolvedValueOnce(true);
        await AsyncStorage.setItem('@accessToken','token');
        const user= userEvent.setup()
        render(<Calendar events={mockEvents} />);

        // Initially, ensure event is loaded
        await waitFor(() => expect(screen.getByText('10:00 AM')).toBeTruthy());

        // Press refresh button
        const refreshButton = screen.getByTestId('refresh-button');
        await user.press(refreshButton);

        // Ensure fetchAndUpdateEvents is called
        await waitFor(() => expect(calendarService.fetchAndUpdateEvents).toHaveBeenCalled());
    });

    it('shows no events message when there are no events for the selected date', async () => {
        render(<Calendar events={[]} />);

        await waitFor(() => {
            expect(screen.getByText('No events or tasks scheduled for this day')).toBeTruthy();
        });
    });

    it('handles selecting a date in the calendar', async () => {
        const user= userEvent.setup()
        render(<Calendar events={[]} />);

        const calendar = screen.getByTestId('calendar');
        await user.press(calendar);

        // Ensure that selecting a day updates the selectedDate state
        await waitFor(() => expect(screen.getByTestId('calendar')).toBeTruthy());
    });

    it('navigates to the map when "Get Directions" is pressed', async () => {

        fetchBuildingCoordinates.mockResolvedValue({ latitude: 37.7749, longitude: -122.4194 });
        const user= userEvent.setup()
        render(<Calendar events={mockEvents} />);

        // Simulate selecting the event
        await user.press(screen.getByText('Hall Building Rm 101'));

        // Simulate pressing "Get Directions"
        const getDirectionsButton = screen.getByTestId('get-directions-button');
        await user.press(getDirectionsButton);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/homemap?lat=37.7749&lng=-122.4194&room=101');
        });
    });
});


