jest.useFakeTimers()
import React from 'react';
import {render, screen, userEvent} from '@testing-library/react-native';
import { ThemeContext } from '@/context/ThemeProvider';
import WeekNavigation from '../WeekNavigation';

// Mocking the getLocalDateString function
jest.mock('../EventList', () => ({
    getLocalDateString: jest.fn((date) => {
        const baseDate = new Date('2025-04-06');
        baseDate.setDate(baseDate.getDate() + date.getDate());
        return baseDate.toISOString().split('T')[0];
    }),
}));

describe('WeekNavigation', () => {
    const mockOnSelectDate = jest.fn();

    const renderWithTheme = (theme) => {
        return render(
            <ThemeContext.Provider value={{ theme }}>
                <WeekNavigation onSelectDate={mockOnSelectDate} />
            </ThemeContext.Provider>
        );
    };

    it('should render the week navigation with correct day labels', () => {
       renderWithTheme('light');

        expect(screen.getByText('Sun')).toBeTruthy();
        expect(screen.getByText('Mon')).toBeTruthy();
        expect(screen.getByText('Tue')).toBeTruthy();
        expect(screen.getByText('Wed')).toBeTruthy();
        expect(screen.getByText('Thu')).toBeTruthy();

    });

    it('should call onSelectDate when a day is clicked', async () => {
        const user=userEvent.setup()
        renderWithTheme('light');

        await user.press(screen.getByText('Sun'));

        // Ensure the onSelectDate callback was called with the correct date
        expect(mockOnSelectDate).toHaveBeenCalledWith('2025-04-12');
    });

    it('should render with correct styles based on theme', () => {
        renderWithTheme('dark');
        expect(screen.getByText('Sun')).toHaveStyle({ color: '#FFFFFF' });
    });
});

