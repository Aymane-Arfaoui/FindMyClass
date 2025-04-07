import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import StartPointSearchBar from '../StartPointSearchBar';


describe('<StartPointSearchBar />', () => {
    let navigation;

    beforeEach(() => {
        navigation = { navigate: jest.fn() };  // Mock navigation
    });


    test('should update search query on text input change', () => {
        const setSearchQueryMock = jest.fn();
        const { getByPlaceholderText } = render(
            <StartPointSearchBar
                navigation={navigation}
                resetTransform={jest.fn()}
                searchQuery=""
                setSearchQuery={setSearchQueryMock}
            />
        );

        const input = getByPlaceholderText('Search Here');
        fireEvent.changeText(input, 'test query');

        expect(setSearchQueryMock).toHaveBeenCalledWith('test query');
    });
   
});

