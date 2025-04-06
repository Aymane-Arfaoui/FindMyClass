import React from 'react';
import { render, userEvent, screen} from '@testing-library/react-native';
import FloorSelector from '../FloorSelector';

describe('FloorSelector', () => {
    let setSelectedFloorKey;

    beforeEach(() => {
        setSelectedFloorKey = jest.fn();
    });

    it('should render null when there is 1 or fewer floors', () => {
        render(<FloorSelector floorKeys={['1']} selectedFloorKey="1" setSelectedFloorKey={setSelectedFloorKey} />);
        expect(screen.queryByTestId('floor-1-button')).toBeNull();
    });

    it('should render floor buttons and allow selection when there are multiple floors', async () => {
        const user=userEvent.setup()
        render( <FloorSelector floorKeys={['1', '2', '3']} selectedFloorKey="1" setSelectedFloorKey={setSelectedFloorKey} /> );

        // Test that the buttons for the floors are rendered
        expect(screen.getByTestId('floor-1-button')).toBeTruthy();
        expect(screen.getByTestId('floor-2-button')).toBeTruthy();
        expect(screen.getByTestId('floor-3-button')).toBeTruthy();

        await user.press(screen.getByTestId('floor-2-button'));

        expect(setSelectedFloorKey).toHaveBeenCalledWith('2');
    });

    it('should disable left arrow button when the first floor is selected', () => {
        render( <FloorSelector floorKeys={['1', '2', '3']} selectedFloorKey="1" setSelectedFloorKey={setSelectedFloorKey} /> );

        const leftArrowButton = screen.getByTestId('back-arrow');
        expect(leftArrowButton).toBeDisabled();
    });

    it('should disable right arrow button when the last floor is selected', () => {
        render(  <FloorSelector floorKeys={['1', '2', '3']} selectedFloorKey="3" setSelectedFloorKey={setSelectedFloorKey} />);

        const rightArrowButton = screen.getByTestId('forward-arrow');
        expect(rightArrowButton).toBeDisabled();
    });

    it('should navigate to the previous floor when left arrow is pressed', async () => {
        const user=userEvent.setup()
        render( <FloorSelector floorKeys={['1', '2', '3']} selectedFloorKey="2" setSelectedFloorKey={setSelectedFloorKey} />);

        const leftArrowButton = screen.getByTestId('back-arrow');
        await user.press(leftArrowButton);
        expect(setSelectedFloorKey).toHaveBeenCalledWith('1');
    });

    it('should navigate to the next floor when right arrow is pressed', async () => {
        const user=userEvent.setup()
        render( <FloorSelector floorKeys={['1', '2', '3']} selectedFloorKey="2" setSelectedFloorKey={setSelectedFloorKey} /> );

        const rightArrowButton = screen.getByTestId('forward-arrow');
        await user.press(rightArrowButton);

        expect(setSelectedFloorKey).toHaveBeenCalledWith('3');
    });
});
