import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import SmartPlannerHeader from '@/components/SmartPlannerHeader'; // Update with the correct import path
import { ThemeContext } from '@/context/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';


describe('SmartPlannerHeader', () => {
    const mockOnBack = jest.fn();
    const mockOnAddTask = jest.fn();
    const mockOnPlanRoute = jest.fn();

    const theme = {
        colors: {
            dark: '#333',
            background: '#fff',
            primary: '#007bff',
        },
    };

    const defaultProps = {
        onBack: mockOnBack,
        onAddTask: mockOnAddTask,
        onPlanRoute: mockOnPlanRoute,
        isPlanRouteMode: false,
        day: '5',
        weekday: 'Mon',
        monthYear: 'Apr 2025',
    };

    // Utility function to render the component with the theme context
    const renderWithTheme = (props = {}) => {
        return render(
            <ThemeContext.Provider value={{ theme }}>
                <SmartPlannerHeader {...defaultProps} {...props} />
            </ThemeContext.Provider>
        );
    };

    it('should render the SmartPlannerHeader correctly', () => {
        renderWithTheme();

        // Check if the day, weekday, and monthYear are rendered
        expect(screen.getByText('5')).toBeTruthy(); // Day should be displayed
        expect(screen.getByText('Mon')).toBeTruthy(); // Weekday should be displayed
        expect(screen.getByText('Apr 2025')).toBeTruthy(); // Month and Year should be displayed
    });

    it('should call onBack when the back button is pressed', () => {
        renderWithTheme();

        // Find the back button and simulate the press
        const backButton = screen.getByTestId('back-button');
        fireEvent.press(backButton);

        // Assert that onBack was called
        expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should call onPlanRoute when the "Plan Route" button is pressed', () => {
        renderWithTheme();

        // Find the "Plan Route" button and simulate the press
        const planRouteButton = screen.getByTestId('plan-route-button');
        fireEvent.press(planRouteButton);

        // Assert that onPlanRoute was called
        expect(mockOnPlanRoute).toHaveBeenCalledTimes(1);
    });

    it('should call onAddTask when the "Add Task" button is pressed', () => {
        renderWithTheme();

        // Find the "Add Task" button and simulate the press
        const addTaskButton = screen.getByTestId('add-task-button');
        fireEvent.press(addTaskButton);

        // Assert that onAddTask was called
        expect(mockOnAddTask).toHaveBeenCalledTimes(1);
    });

    it('should not render "Plan Route" and "Add Task" buttons when isPlanRouteMode is true', () => {
        renderWithTheme({ isPlanRouteMode: true });

        // Check that the "Plan Route" and "Add Task" buttons are not rendered
        const planRouteButton = screen.queryByTestId('plan-route-button');
        const addTaskButton = screen.queryByTestId('add-task-button');

        expect(planRouteButton).toBeNull();
        expect(addTaskButton).toBeNull();
    });

    it('should render "Plan Route" and "Add Task" buttons when isPlanRouteMode is false', () => {
        renderWithTheme({ isPlanRouteMode: false });

        // Check that the "Plan Route" and "Add Task" buttons are rendered
        const planRouteButton = screen.getByTestId('plan-route-button');
        const addTaskButton = screen.getByTestId('add-task-button');

        expect(planRouteButton).toBeTruthy();
        expect(addTaskButton).toBeTruthy();
    });
});
