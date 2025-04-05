import EditTasks from "@/components/EditTasks";

jest.useFakeTimers()
import React from 'react';
import {render, fireEvent, waitFor,screen, userEvent} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert, TextInput} from 'react-native';

// Mock the GooglePlacesAutocomplete component

global.fetch = jest.fn();
jest.mock('react-native-date-picker', () => 'DatePicker');

jest.spyOn(Alert, 'alert').mockImplementation(() => {});
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

describe('EditTask Component', () => {
    const mockOnClose = jest.fn();
    const mockOnTaskCreated = jest.fn();

    const taskData = {
        id: '1',
        taskName: 'Old Task',
        notes: 'Some notes',
        address: '123 Main St',
        date: new Date().toISOString(),
        startTime: new Date().toISOString(),
        endTime: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
        allDayEvent: false,
    };


    beforeEach(() => {
        jest.clearAllMocks();
    });



    it('toggles all-day event switch', async () => {
        const user =userEvent.setup()
       render(
            <EditTasks isVisible={true} onClose={mockOnClose} onTaskCreated={mockOnTaskCreated} />
        );

        const allDaySwitch = screen.getByTestId('all-day-switch');
        expect(allDaySwitch.props.value).toBe(false);

        // Simulate toggling the switch to true
        fireEvent.press(allDaySwitch);
        await waitFor (()=>{expect(allDaySwitch.props.value).toBe(true)});
    });



    it('calls onClose when modal is closed', async () => {
        const user =userEvent.setup()
        render(
            <EditTasks isVisible={true} onClose={mockOnClose} onTaskCreated={mockOnTaskCreated} />
        );

        await user.press(screen.getByTestId('close-button'));

        expect(mockOnClose).toHaveBeenCalled();
    });


    test('should handle all day event toggle', async () => {
        render(<EditTasks isVisible={true} onClose={() => {}} onTaskCreated={() => {}} />);

        expect(screen.getByTestId('all-day-switch')).toHaveProp('value', false);

        // Toggle the switch to true (set allDayEvent to true)
        fireEvent(screen.getByTestId('all-day-switch'), 'onValueChange', true);

        expect(screen.getByTestId('all-day-switch')).toHaveProp('value', true);
    });

    test('should handle start and end time pickers', async () => {
        const user =userEvent.setup()
       render(<EditTasks isVisible={true} onClose={() => {}} onTaskCreated={() => {}} />);


        expect(screen.getByTestId('start-time-picker-toggle')).toBeOnTheScreen();
        expect(screen.getByTestId('end-time-picker-toggle')).toBeOnTheScreen();

        await user.press(screen.getByTestId('start-time-picker-toggle'));
        await user.press(screen.getByTestId('end-time-picker-toggle'));

    });

    test('should render modal when isVisible is true', () => {
        const { getByText } = render(
            <EditTasks isVisible={true} onClose={() => {}} taskData={taskData} onUpdate={() => {}} />
        );

        expect(getByText('Edit Task')).toBeTruthy();
    });

    test('should hide modal when isVisible is false', () => {
        const { queryByText } = render(
            <EditTasks isVisible={false} onClose={() => {}} taskData={taskData} onUpdate={() => {}} />
        );

        expect(queryByText('Edit Task')).toBeNull();
    });



    test('should show error if task name is empty when saving', async () => {
        const { getByText, getByPlaceholderText } = render(
            <EditTasks isVisible={true} onClose={() => {}} taskData={taskData} onUpdate={() => {}} />
        );

        fireEvent.changeText(getByPlaceholderText('Task Name'), '');
        fireEvent.press(getByText('Update Task'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a task name');
        });
    });

    test('should update task and save to AsyncStorage', async () => {
        const mockOnUpdate = jest.fn();
        const { getByText, getByPlaceholderText } = render(
            <EditTasks isVisible={true} onClose={() => {}} taskData={taskData} onUpdate={mockOnUpdate} />
        );

        fireEvent.changeText(getByPlaceholderText('Task Name'), 'Updated Task');
        fireEvent.changeText(getByPlaceholderText('Add notes'), 'Updated notes');

        AsyncStorage.setItem.mockResolvedValueOnce(undefined); // Mock AsyncStorage setItem

        await waitFor(async () => {
            fireEvent.press(getByText('Update Task'));
        });

        // Ensure onUpdate is called after update
        expect(mockOnUpdate).toHaveBeenCalled();

        // Check AsyncStorage.setItem call to ensure task is saved
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            'tasks',
            expect.any(String)
        );
    });

    test('should handle delete task', async () => {
        const mockOnUpdate = jest.fn();
        const { getByText } = render(
            <EditTasks isVisible={true} onClose={() => {}} taskData={taskData} onUpdate={mockOnUpdate} />
        );

        AsyncStorage.setItem.mockResolvedValueOnce(undefined); // Mock AsyncStorage setItem

        fireEvent.press(getByText('Delete Task'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'Delete Task',
                'Are you sure you want to delete this task?',
                expect.anything(),
                {"cancelable": true}

            );
        });

        // Simulate delete action
        const deleteButton = Alert.alert.mock.calls[0][2][1].onPress;
        await deleteButton();

        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
            'tasks',
            expect.any(String)
        );

        expect(mockOnUpdate).toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Task deleted successfully!');
    });

});

