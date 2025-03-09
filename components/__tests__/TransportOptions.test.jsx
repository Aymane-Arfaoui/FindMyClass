import React, { useState } from 'react';
import {render, screen, userEvent} from '@testing-library/react-native';
import TransportOptions from '../TransportOptions';
describe('TransportOptions', () => {
    let setModeSelected = jest.fn();
    let selectedStyle={ color: 'white' };
    let  travelTimes = {
        driving: '10 min',
        transit: '15 min',
        walking: '30 min',
        bicycling: '20 min',
    };

    it('renders', () => {
       const {unmount}= render(
            <TransportOptions
                modeSelected=""
                setModeSelected={setModeSelected}
                travelTimes={travelTimes}
            />
        );

        expect(screen.getByTestId('transport-options')).toBeOnTheScreen();
        unmount();
    });

    it('renders the transport options correctly', () => {
        const {unmount}= render(
            <TransportOptions
                modeSelected=""
                setModeSelected={setModeSelected}
                travelTimes={travelTimes}
            />
        );

        // Check that each mode is rendered with its respective time
        expect(screen.getByText('10 min')).toBeOnTheScreen();
        expect(screen.getByText('15 min')).toBeOnTheScreen();
        expect(screen.getByText('30 min')).toBeOnTheScreen();
        expect(screen.getByText('20 min')).toBeOnTheScreen();
        unmount();
    });


    it('calls setModeSelected when an option is pressed', async () => {
        const user = userEvent.setup();

        const {unmount}=render(
            <TransportOptions
                modeSelected=""
                setModeSelected={setModeSelected}
                travelTimes={travelTimes}
            />
        );

        await user.press(screen.getByText('10 min'));

        expect(setModeSelected).toHaveBeenCalledWith('driving');
        unmount();
    });

    // it('applies the selected style when a mode is selected', async () => {
    //     const user = userEvent.setup();
    //     const { unmount } = render(
    //         <TransportOptions
    //             modeSelected=''
    //             setModeSelected={setModeSelected}
    //             travelTimes={travelTimes}
    //         />
    //     );
    //
    //     await user.press(screen.getByText('20 min'));
    //     expect(screen.getByText('20 min')).toHaveStyle(selectedStyle);
    //
    //     expect(screen.getByText('10 min')).not.toHaveStyle(selectedStyle);
    //
    //     unmount();
    // });
});