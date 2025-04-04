jest.useFakeTimers()
import React from 'react';
import { render, userEvent, screen } from '@testing-library/react-native';
import BuildingDetailsPanel from '../BuildingDetailsPanel';
import { useNavigation } from '@react-navigation/native';

describe('BuildingDetailsPanel', () => {
    const mockBuildingDetails = {
        formattedAddress: "123 Main St, City, Country",
        photos: [{ photo_reference: '123abc' }],
    };
    const mockOnClose = jest.fn();
    const mockOnDirectionPress = jest.fn();
    const mockNavigate =jest.fn();

    const currentLocation = { geometry: { coordinates: [1,2] } };
    const mode = 'driving';
    const GOOGLE_PLACES_API_KEY = "test";
    let buildingDetailsComponent=(selectedBuilding,loading)=>{
        return (<BuildingDetailsPanel
            selectedBuilding={selectedBuilding}
            buildingDetails={{ ...mockBuildingDetails, photos: [] }}
            panHandlers={{}} // mock panHandlers if needed
            panelY={0}
            onClose={mockOnClose}
            onDirectionPress={mockOnDirectionPress}
            currentLocation={currentLocation}
            mode={mode}
            GOOGLE_PLACES_API_KEY={GOOGLE_PLACES_API_KEY}
            loading={loading}
        />);
    }

    beforeAll(()=>{
        useNavigation.mockReturnValue({
            navigate:mockNavigate,
            goBack:jest.fn()
        })})

    it('should render building name and address', () => {
        render(buildingDetailsComponent({ name: "Hall Building" },false));


        expect(screen.getByText('Hall Building')).toBeTruthy();
        expect(screen.getByText('123 Main St, City, Country')).toBeTruthy();
    });

    it('should show loading indicator when loading is true', () => {
        render(buildingDetailsComponent({ name: "Hall Building" },true));

        expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    });

    it('should trigger onClose when close button is pressed', async () => {
        render(buildingDetailsComponent({ name: "Hall Building" },false));
        const user = userEvent.setup()
        await user.press(screen.getByTestId('close-button'));
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onDirectionPress when directions button is pressed', async () => {
        render(buildingDetailsComponent({ name: "Hall Building" },false));

        const user = userEvent.setup()
        await user.press(screen.getByTestId('direction-button'));
        expect(mockOnDirectionPress).toHaveBeenCalledWith(currentLocation, { name: "Hall Building" }, mode);
    });

    it('should navigate to "MapScreen" with key hall when indoor map button is pressed and hall is selected', async () => {

        render(buildingDetailsComponent({ name: "Hall Building" },false));

        const user = userEvent.setup()
        await user.press(screen.getByTestId('indoor-map-button'));
        expect(mockNavigate).toHaveBeenCalledWith('MapScreen', {buildingKey: 'Hall'});
    });
    it('should navigate to "MapScreen" with key CC when indoor map button is pressed and CC is selected', async () => {
        render(buildingDetailsComponent({name: "Central Building"},false));

        const user = userEvent.setup()
        await user.press(screen.getByTestId('indoor-map-button'));
        expect(mockNavigate).toHaveBeenCalledWith('MapScreen', {buildingKey: 'CC'});
    });
    it('should navigate to "MapScreen" with key MB when indoor map button is pressed and MB is selected', async () => {
        render(buildingDetailsComponent({name: "John Molson"},false));

        const user = userEvent.setup()
        await user.press(screen.getByTestId('indoor-map-button'));
        expect(mockNavigate).toHaveBeenCalledWith('MapScreen', {buildingKey: 'MB'});
    });

    it('should use default image if no photo reference is available', () => {
        render(buildingDetailsComponent({ name: "Hall Building" },false));

        const defaultImage = screen.getByTestId('default-image');
        expect(defaultImage.props.source.uri).toBe("https://www.kpmb.com/wp-content/uploads/2016/06/0004_N76_300dpi-scaled.jpg");
    });
});
