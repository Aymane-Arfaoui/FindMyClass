jest.useFakeTimers()
import React from 'react';
import { render, userEvent, act, waitFor,screen } from '@testing-library/react-native';
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

       render(<SearchBars {...defaultProps} />);
        await waitFor(()=>{
            expect(screen.getByTestId('search-bars')).toBeTruthy();
            expect(screen.getByPlaceholderText('Starting Point')).toBeTruthy();
            expect(screen.getByPlaceholderText('Destination')).toBeTruthy();
        })

    });

    it('fetches and sets start location from coordinates', async () => {

        render(<SearchBars {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Starting Point').props.value).toBe('123 Test Street');
        });
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('https://maps.googleapis.com/maps/api/geocode/json')
        );

    });

    it('handles fetchRoutesData successfully', async () => {

        render(<SearchBars {...defaultProps} />);

        await waitFor(() => {
            expect(mockSetTravelTimes).toHaveBeenCalledWith(
                expect.objectContaining({
                    walking: '15 min'
                })
            );
        });
    });

    it('handles address change and shows suggestions', async () => {

        render(<SearchBars {...defaultProps} />);
        const user=userEvent.setup()
        await user.type(screen.getByPlaceholderText('Starting Point'), 'test');


        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('https://maps.googleapis.com/maps/api/place/autocomplete/json')
        );
    });

    it('handles back button press', async () => {

       render(<SearchBars {...defaultProps} />);
        const user=userEvent.setup()
        await user.press(screen.getByTestId('back-button'));
        await waitFor(() => {
            expect(mockOnBackPress).toHaveBeenCalled();
        })
    });

    it('handles error when fetching start location', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        global.fetch=jest.fn()
        global.fetch.mockRejectedValueOnce(new Error('Fetch error'));

        render(<SearchBars {...defaultProps} />);

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Starting Point').props.value).toBe('Unable to fetch address');
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

    // it('handles empty suggestions when input is too short', async () => {
    //    render(<SearchBars {...defaultProps} />);
    //
    //
    //     const user=userEvent.setup()
    //     await user.type(screen.getByPlaceholderText('Starting Point'), 'te'); // Less than 3 characters
    //
    //     expect(global.fetch).not.toHaveBeenCalledWith(
    //         expect.stringContaining('https://maps.googleapis.com/maps/api/place/autocomplete/json')
    //     );
    // });
});