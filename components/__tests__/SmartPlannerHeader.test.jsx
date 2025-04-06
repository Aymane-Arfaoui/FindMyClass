jest.useFakeTimers()
import React from 'react';
import { render, userEvent, screen } from '@testing-library/react-native';
import SmartPlannerHeader from '@/components/SmartPlannerHeader';
import { ThemeContext } from '@/context/ThemeProvider';


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

        expect(screen.getByText('5')).toBeTruthy();
        expect(screen.getByText('Mon')).toBeTruthy();
        expect(screen.getByText('Apr 2025')).toBeTruthy();
    });

    it('should call onBack when the back button is pressed', async () => {
        const user=userEvent.setup()
        renderWithTheme();


        const backButton = screen.getByTestId('back-button');
        await user.press(backButton);

        expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should call onPlanRoute when the "Plan Route" button is pressed', async () => {
        const user=userEvent.setup()
        renderWithTheme();

        const planRouteButton = screen.getByTestId('plan-route-button');
        await user.press(planRouteButton);

        expect(mockOnPlanRoute).toHaveBeenCalledTimes(1);
    });

    it('should call onAddTask when the "Add Task" button is pressed', async () => {
        const user=userEvent.setup()
        renderWithTheme();

        const addTaskButton = screen.getByTestId('add-task-button');
        await user.press(addTaskButton);

        expect(mockOnAddTask).toHaveBeenCalledTimes(1);
    });

    it('should not render "Plan Route" and "Add Task" buttons when isPlanRouteMode is true', () => {
        renderWithTheme({ isPlanRouteMode: true });

        const planRouteButton = screen.queryByTestId('plan-route-button');
        const addTaskButton = screen.queryByTestId('add-task-button');

        expect(planRouteButton).toBeNull();
        expect(addTaskButton).toBeNull();
    });

    it('should render "Plan Route" and "Add Task" buttons when isPlanRouteMode is false', () => {
        renderWithTheme({ isPlanRouteMode: false });

        const planRouteButton = screen.getByTestId('plan-route-button');
        const addTaskButton = screen.getByTestId('add-task-button');

        expect(planRouteButton).toBeTruthy();
        expect(addTaskButton).toBeTruthy();
    });
});
