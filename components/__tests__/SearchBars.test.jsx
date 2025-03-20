jest.useFakeTimers()
import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import SearchBars from '../SearchBars'; // adjust path as needed

// Mock dependencies
jest.mock('react-native-config', () => ({
    GOOGLE_PLACES_API_KEY: 'mock-api-key',
}));



describe('SearchBars', () => {
    const mockOnBackPress = jest.fn();
    const mockSetModeSelected = jest.fn();
    const mockSetTravelTimes = jest.fn();
    const defaultProps = {
        currentLocation: {
            geometry: { coordinates: [-73.5789, 45.4960] }
        },
        destination: 'Test Destination',
        onBackPress: mockOnBackPress,
        modeSelected: 'walking',
        setModeSelected: mockSetModeSelected,
        travelTimes: {
            driving: 'N/A',
            transit: 'N/A',
            walking: 'N/A',
            bicycling: 'N/A'
        },
        setTravelTimes: mockSetTravelTimes
    };

    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn();
        global.fetch
            .mockResolvedValueOnce({ // Initial geocode fetch
                json: () => Promise.resolve({
                    results: [{ formatted_address: '123 Test Street' }]
                })
            })
            .mockResolvedValue({ // Route fetch
                json: () => Promise.resolve({
                    routes: [{ legs: [{ duration: { value: 900 } }] }]
                })
            });
    });

    it('renders correctly', async () => {

        const { getByTestId, getByPlaceholderText } = render(<SearchBars {...defaultProps} />);
        await waitFor(()=>{
            expect(getByTestId('search-bars')).toBeTruthy();
            expect(getByPlaceholderText('Starting Point')).toBeTruthy();
            expect(getByPlaceholderText('Destination')).toBeTruthy();
        })

    });

    it('fetches and sets start location from coordinates', async () => {


        const { getByPlaceholderText } = render(<SearchBars {...defaultProps} />);

        await waitFor(() => {
            expect(getByPlaceholderText('Starting Point').props.value).toBe('123 Test Street');
        });
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('https://maps.googleapis.com/maps/api/geocode/json')
        );

    });

    it('handles fetchRoutesData successfully', async () => {


        const { getByTestId } = render(<SearchBars {...defaultProps} />);

        await waitFor(() => {
            expect(mockSetTravelTimes).toHaveBeenCalledWith(
                expect.objectContaining({
                    walking: '15 min'
                })
            );
        });
    });

    it('handles address change and shows suggestions', async () => {

        const { getByPlaceholderText } = render(<SearchBars {...defaultProps} />);
        const startInput = getByPlaceholderText('Starting Point');

        await act(async () => {
            fireEvent.changeText(startInput, 'test');
        });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('https://maps.googleapis.com/maps/api/place/autocomplete/json')
        );
    });

    it('handles back button press', async () => {

        const { getByTestId } = render(<SearchBars {...defaultProps} />);

        fireEvent.press(getByTestId('back-button'));
        await waitFor(() => {
            expect(mockOnBackPress).toHaveBeenCalled();
        })
    });

    it('handles error when fetching start location', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        global.fetch=jest.fn()
        global.fetch.mockRejectedValueOnce(new Error('Fetch error'));

        const { getByPlaceholderText } = render(<SearchBars {...defaultProps} />);

        await waitFor(() => {
            expect(getByPlaceholderText('Starting Point').props.value).toBe('Unable to fetch address');
        });

        expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching address:', expect.any(Error));
        consoleErrorSpy.mockRestore();
    });

    it('updates travel times when locations change', async () => {


        render(<SearchBars {...defaultProps} />);

        await waitFor(() => {
            expect(mockSetTravelTimes).toHaveBeenCalledWith(
                expect.objectContaining({
                    walking: '15 min'
                })
            );
        });
    });

    it('handles empty suggestions when input is too short', async () => {
        const { getByPlaceholderText } = render(<SearchBars {...defaultProps} />);
        const startInput = getByPlaceholderText('Starting Point');

        await act(async () => {
            fireEvent.changeText(startInput, 'te'); // Less than 3 characters
        });

        expect(global.fetch).not.toHaveBeenCalledWith(
            expect.stringContaining('https://maps.googleapis.com/maps/api/place/autocomplete/json')
        );
    });
});