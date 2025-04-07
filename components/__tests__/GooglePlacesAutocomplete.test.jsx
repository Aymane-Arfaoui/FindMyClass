import React from 'react';
import { render, userEvent, waitFor, screen } from '@testing-library/react-native';
import GooglePlacesAutocomplete from '../GooglePlacesAutocomplete'; // Adjust the import as needed

global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({
            suggestions: [
                { placePrediction: { placeId: '1', text: { text: '123 Main St' } } },
                { placePrediction: { placeId: '2', text: { text: '456 Test St' } } },
            ],
        }),
    })
);

describe('GooglePlacesAutocomplete', () => {
    const onAddressSelect = jest.fn();
    let user=null

    beforeEach(() => {
        jest.clearAllMocks();
        user=userEvent.setup()
    });

    it('should render input and handle text change', async () => {

        render(
            <GooglePlacesAutocomplete
                address=""
                onAddressSelect={onAddressSelect}
                autoFocus={false}
            />
        );

        const input = screen.getByPlaceholderText('Enter Address');
        await user.type(input, 'Main');

        // Wait for predictions to be fetched
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith(
                'https://places.googleapis.com/v1/places:autocomplete', expect.objectContaining({
                    method: 'POST',
                })
            );

        });

        // Check if predictions are rendered
        expect(await screen.findByText('123 Main St')).toBeTruthy();
        expect(await screen.findByText('456 Test St')).toBeTruthy();
    });

    it('should call onAddressSelect when a suggestion is selected', async () => {
        render(
            <GooglePlacesAutocomplete
                address=""
                onAddressSelect={onAddressSelect}
                autoFocus={false}
            />
        );

        const input = screen.getByPlaceholderText('Enter Address');
        await user.type(input, 'Main');

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

        const suggestion = screen.getByText('123 Main St');
        await user.press(suggestion);

        expect(onAddressSelect).toHaveBeenCalledWith('123 Main St');
    });

    it('should clear input and hide suggestions when clear button is pressed', async () => {
        render(
            <GooglePlacesAutocomplete
                address="Test Address"
                onAddressSelect={onAddressSelect}
                autoFocus={false}
            />
        );

        const input = screen.getByPlaceholderText('Enter Address');
        const clearButton = screen.getByTestId('clear-button');

        await user.press(clearButton);

        expect(input.props.value).toBe('');
        expect(screen.queryByText('123 Main St')).toBeNull();
        expect(screen.queryByText('456 Test St')).toBeNull();
    });

    it('should show clear button when input has text', async () => {
        render(
            <GooglePlacesAutocomplete
                address="Test Address"
                onAddressSelect={onAddressSelect}
                autoFocus={false}
            />
        );

        const clearButton = screen.getByTestId('clear-button');
        expect(clearButton).toBeTruthy();

        await user.press(clearButton);
        expect(screen.queryByText('123 Main St')).toBeNull();
    });

    it('should not show suggestions when input is empty', async () => {
        render(
            <GooglePlacesAutocomplete
                address=""
                onAddressSelect={onAddressSelect}
                autoFocus={false}
            />
        );

        const input = screen.getByPlaceholderText('Enter Address');
        await user.type(input, '');

        await waitFor(() => expect(screen.queryByText('123 Main St')).toBeNull());
        await waitFor(() => expect(screen.queryByText('456 Test St')).toBeNull());
    });
});
