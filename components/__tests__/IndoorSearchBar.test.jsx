import React from 'react';
import {render, waitFor, screen, userEvent} from '@testing-library/react-native';
import IndoorSearchBar from '../IndoorSearchBar';
jest.mock('@expo/vector-icons', () => ({
    Ionicons: jest.fn(() => null),
}));

describe('IndoorSearchBar', () => {
    let setSelectedFloorKeyMock;
    let setSelectedSectionMock;
    let resetTransformMock;
    let navigationMock;

    beforeEach(() => {
        setSelectedFloorKeyMock = jest.fn();
        setSelectedSectionMock = jest.fn();
        resetTransformMock = jest.fn();
        navigationMock = { navigate: jest.fn() };
    });

    it('should render the search bar correctly', () => {
        render(
            <IndoorSearchBar
                navigation={navigationMock}
                setSelectedFloorKey={setSelectedFloorKeyMock}
                setSelectedSection={setSelectedSectionMock}
                resetTransform={resetTransformMock}
            />
        );

        const searchInput = screen.getByPlaceholderText('Search Here');
        expect(searchInput).toBeOnTheScreen();
    });

    it('should update search query on text input', async () => {
        render(
            <IndoorSearchBar
                navigation={navigationMock}
                setSelectedFloorKey={setSelectedFloorKeyMock}
                setSelectedSection={setSelectedSectionMock}
                resetTransform={resetTransformMock}
            />
        );
        const searchInput = screen.getByPlaceholderText('Search Here');
        const user=userEvent.setup();
        await user.type(searchInput, 'restaurant');

        await waitFor(() => {
            expect(searchInput.props.value).toBe('restaurant');
        });
    });

    it('should display search results when a query is entered', async () => {
        render(
            <IndoorSearchBar
                navigation={navigationMock}
                setSelectedFloorKey={setSelectedFloorKeyMock}
                setSelectedSection={setSelectedSectionMock}
                resetTransform={resetTransformMock}
            />
        );

        const searchInput = screen.getByPlaceholderText('Search Here');
        const user=userEvent.setup();
        await user.type(searchInput, 'H-133');

        await waitFor(() => {
            // Assuming "restaurant" matches some section in floorsData
            expect(screen.getByText('H-133 - Hall, Floor 1')).toBeTruthy();
        });
    });

    it('should call handleClearSearch when the clear button is pressed', async () => {
        render(
            <IndoorSearchBar
                navigation={navigationMock}
                setSelectedFloorKey={setSelectedFloorKeyMock}
                setSelectedSection={setSelectedSectionMock}
                resetTransform={resetTransformMock}
            />
        );

        const searchInput = screen.getByPlaceholderText('Search Here');
        const user=userEvent.setup();
        await user.type(searchInput, 'restaurant');

        const clearButton = screen.getByTestId('clear-button'); // Assuming you add testID="clear-button" to the clear button
        await user.press(clearButton);

        await waitFor(() => {
            expect(searchInput.props.value).toBe('');
            expect(setSelectedSectionMock).toHaveBeenCalledWith(null);
            expect(resetTransformMock).toHaveBeenCalled();
        });
    });

    it('should call handleSelectSearchResult when a search result is selected', async () => {


        render(
            <IndoorSearchBar
                navigation={navigationMock}
                setSelectedFloorKey={setSelectedFloorKeyMock}
                setSelectedSection={setSelectedSectionMock}
                resetTransform={resetTransformMock}
            />
        );

        const searchInput = screen.getByPlaceholderText('Search Here');
        const user=userEvent.setup();
        await user.type(searchInput, 'H-133');



        const resultItem = screen.getByText('H-133 - Hall, Floor 1');
        await user.press(resultItem);

        await waitFor(() => {
            expect(setSelectedFloorKeyMock).toHaveBeenCalledWith("1");

            expect(setSelectedSectionMock).toHaveBeenCalledWith(
                {
                    d: "M637.223 265.783H602.641V160.83H705.849V126.737H844.893V210.509H748.852V198.132H703.159V229.159H678.973V240.859H637.223V265.783Z",
                    floor_number:"1",
                    id: "H-133",
                    ref_ID: "h1_133"
                });

            expect(navigationMock.navigate).toHaveBeenCalledWith('MapScreen', {
                    buildingKey: "Hall",
                floorKey: "1",
                section:{
                    d: "M637.223 265.783H602.641V160.83H705.849V126.737H844.893V210.509H748.852V198.132H703.159V229.159H678.973V240.859H637.223V265.783Z",
                    floor_number:"1",
                    id: "H-133",
                    ref_ID: "h1_133"
                    },
            });
        });
    });
});