jest.useFakeTimers()
import React from 'react';
import {render, fireEvent, act, waitFor, screen, userEvent} from '@testing-library/react-native';
import MainSearchBar from '../MainSearchBar'; // adjust path as needed
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import {Alert} from "react-native";

// Mock dependencies
jest.mock('react-native-config', () => ({
    GOOGLE_PLACES_API_KEY: 'mock-api-key',
}));
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('expo-speech-recognition', () => ({
    ExpoSpeechRecognitionModule: {
        getPermissionsAsync: jest.fn(),
        requestPermissionsAsync: jest.fn(),
        start: jest.fn(),
    },
    useSpeechRecognitionEvent: jest.fn(),
}));



describe('MainSearchBar', () => {

    const mockOnLocationSelect = jest.fn();
    const mockOnBuildingPress = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        ExpoSpeechRecognitionModule.getPermissionsAsync.mockResolvedValue({ granted: true });
        ExpoSpeechRecognitionModule.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValue({
                suggestions: [
                    {
                        placePrediction: {
                            placeId: '1',
                            text: { text: 'Place 1' }
                        }
                    }
                ]
            })
        });
    });


    it('renders correctly', async () => {
        render(<MainSearchBar onLocationSelect={mockOnLocationSelect} onBuildingPress={mockOnBuildingPress} />);

        await waitFor(() => {
        expect(screen.getByPlaceholderText('Search Here')).toBeTruthy();
        expect(screen.getByTestId('mic-button')).toBeTruthy();})
    });

    it('checks microphone permission on mount', async () => {
        render(<MainSearchBar onLocationSelect={mockOnLocationSelect} onBuildingPress={mockOnBuildingPress} />);

        await waitFor(() => {
            expect(ExpoSpeechRecognitionModule.getPermissionsAsync).toHaveBeenCalled();
        });
    });

    it('handles microphone permission errors gracefully', async () => {
        ExpoSpeechRecognitionModule.getPermissionsAsync.mockResolvedValueOnce({ granted: false });
        render(<MainSearchBar onLocationSelect={mockOnLocationSelect} onBuildingPress={mockOnBuildingPress} />);

        // Simulate clicking the microphone button
        fireEvent.press(screen.getByTestId('mic-button'));

        // Check if alert is shown when microphone permission is denied
        await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith(
            'Permission Required',
            'Microphone access is needed for voice search.'
        ));
    });

    it('starts voice recognition when mic button is pressed', async () => {
        const user=userEvent.setup()
        const { getByTestId } = render(
            <MainSearchBar onLocationSelect={mockOnLocationSelect} onBuildingPress={mockOnBuildingPress} />
        );


        await user.press(getByTestId('mic-button'));


        expect(ExpoSpeechRecognitionModule.start).toHaveBeenCalledWith({
            lang: 'en-US',
            interimResults: false,
            maxAlternatives: 1,
        });
    });

    it('handles speech recognition result', async () => {


        const mockEventHandler = jest.fn();
        require('expo-speech-recognition').useSpeechRecognitionEvent.mockImplementation((event, handler) => {
            if (event === 'result') mockEventHandler.mockImplementation(handler);
        });

        const { getByTestId } = render(
            <MainSearchBar onLocationSelect={mockOnLocationSelect} onBuildingPress={mockOnBuildingPress}/>
        );

        await act(async () => {
            mockEventHandler({
                results: [{ transcript: 'test speech' }],
            });
        });

        expect(getByTestId('search-input').props.value).toBe('test speech');
    });

    it('selects a place and calls onLocationSelect and onBuildingPress', async () => {
        const user=userEvent.setup()
        render(<MainSearchBar onLocationSelect={mockOnLocationSelect} onBuildingPress={mockOnBuildingPress} />);

        await user.type(screen.getByTestId('search-input'), 'Place');

        await waitFor(() => expect(fetch).toHaveBeenCalled());

        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValue({
                location: { latitude:  45.4973, longitude: -73.5788 }
            })
        });
        await waitFor(() => expect(screen.getByText('Place 1')).toBeOnTheScreen());
        await user.press(await screen.findByTestId('Place 1'));




        expect(mockOnLocationSelect).toHaveBeenCalledWith([-73.5788, 45.4973]);
        expect(mockOnBuildingPress).toHaveBeenCalledWith(
            { name: 'Unknown Location', textPosition: [-73.5788, 45.4973] },
            -73.5788, 45.4973
        );

    });

    it('handles place autocomplete error', async () => {
        const user=userEvent.setup()
        render(<MainSearchBar onLocationSelect={mockOnLocationSelect} onBuildingPress={mockOnBuildingPress} />);

        await user.type(screen.getByTestId('search-input'), 'Place');

        await waitFor(() => expect(fetch).toHaveBeenCalled());

        await waitFor(() => expect(screen.getByText('Place 1')).toBeOnTheScreen());
        await user.press(screen.getByTestId('Place 1'));

        global.fetch = jest.fn().mockResolvedValueOnce({
            json: jest.fn().mockResolvedValue({
                error:{message:'error fetching'}
            })
        });

        await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith(
            "Error", 'Failed to fetch place details.'
        ));

    });

    it('clears input when clear input button is clicked', async () => {
        const user = userEvent.setup()
        render(<MainSearchBar onLocationSelect={mockOnLocationSelect} onBuildingPress={mockOnBuildingPress}/>);

        const input = screen.getByTestId('search-input');

        await user.type(screen.getByTestId('search-input'), 'Place');

        // Check that the input has text
        expect(input.props.value).toBe('Place');

        await user.press(screen.getByTestId('clear-input-button'));

        // Check that the input is cleared
        expect(input.props.value).toBe('');
    });


});