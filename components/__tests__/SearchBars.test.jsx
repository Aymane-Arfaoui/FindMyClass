import SearchBars from '../SearchBars.jsx';
import {render, screen, } from '@testing-library/react-native';

global.fetch = jest.fn();

const mockResponse = {
    results: [{ formatted_address: '123 test' }]
};

describe('SearchBars', () => {

    let  travelTimes = {
        driving: '10 min',
        transit: '15 min',
        walking: '30 min',
        bicycling: '20 min',
    };

    beforeEach(() => {
        fetch.mockReset();
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve(mockResponse),
        });

    });

    it('renders the component correctly', () => {
        global.setTravelTimes=jest.fn();
        render(
            <SearchBars
                currentLocation={{ geometry: { coordinates: [0, 0] } }}
                destination="456 Another St"
                onBackPress={jest.fn()}
                modeSelected="driving"
                setModeSelected={jest.fn()}
                travelTimes={travelTimes}
            />
        );

        expect(screen.getByTestId('search-bars')).toBeTruthy();
    });


});