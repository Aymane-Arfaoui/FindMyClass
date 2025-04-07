jest.useFakeTimers()
import React from 'react';
import {render, fireEvent, waitFor,screen, userEvent} from '@testing-library/react-native';
import CreateTask  from '../CreateTask';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert, TextInput} from 'react-native';


global.fetch = jest.fn();
jest.mock('react-native-date-picker', () => 'DatePicker');

jest.spyOn(Alert, 'alert').mockImplementation(() => {});
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

describe('CreateTask Component', () => {
    const mockOnClose = jest.fn();
    const mockOnTaskCreated = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly and handles input changes', async () => {
        const user =userEvent.setup()
        render(
            <CreateTask isVisible={true} onClose={mockOnClose} onTaskCreated={mockOnTaskCreated} />
        );

        const taskNameInput = screen.getByPlaceholderText('Task Name');
        const notesInput = screen.getByPlaceholderText('Add notes');
        const addressInput= screen.getByPlaceholderText('Enter Address');

        // Simulate typing in the task name and notes
        await user.type(taskNameInput, 'New Task');
        await user.type(notesInput, 'This is a test task');
        await user.type(addressInput, '123 test st');

        // Assert that the text inputs reflect the changes
        expect(taskNameInput.props.value).toBe('New Task');
        expect(notesInput.props.value).toBe('This is a test task');
        expect(addressInput.props.value).toBe('123 test st');
    });


    it('toggles all-day event switch', async () => {
        const user =userEvent.setup()
       render(
            <CreateTask isVisible={true} onClose={mockOnClose} onTaskCreated={mockOnTaskCreated} />
        );

        const allDaySwitch = screen.getByTestId('all-day-switch');
        expect(allDaySwitch.props.value).toBe(false);

        // Simulate toggling the switch to true
        fireEvent.press(allDaySwitch);
        await waitFor (()=>{expect(allDaySwitch.props.value).toBe(true)});
    });

    it('displays error alert when task name is not provided', async () => {
        const user =userEvent.setup()
        render(
            <CreateTask isVisible={true} onClose={mockOnClose} onTaskCreated={mockOnTaskCreated} />
        );
        await user.press(screen.getByText('Create Event'));

        await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a task name'));
    });

    it('saves task and calls onTaskCreated callback', async () => {
        AsyncStorage.getItem.mockResolvedValueOnce('[]');  // Return empty array for tasks
        const user =userEvent.setup()
       render(
            <CreateTask isVisible={true} onClose={mockOnClose} onTaskCreated={mockOnTaskCreated} />
        );

        // Enter task name and other details
        fireEvent.changeText(screen.getByPlaceholderText('Task Name'), 'Test Task');
        fireEvent.changeText(screen.getByPlaceholderText('Add notes'), 'Test notes');

        await user.press(screen.getByText('Create Event'));

        await waitFor(() => {
            expect(AsyncStorage.setItem).toHaveBeenCalled();
            expect(mockOnTaskCreated).toHaveBeenCalled();
            expect(Alert.alert).toHaveBeenCalledWith('Success', 'Task created successfully!');
        });
    });

    it('calls onClose when modal is closed', async () => {
        const user =userEvent.setup()
        render(
            <CreateTask isVisible={true} onClose={mockOnClose} onTaskCreated={mockOnTaskCreated} />
        );

        await user.press(screen.getByTestId('close-button'));

        expect(mockOnClose).toHaveBeenCalled();
    });


    test('should handle all day event toggle', async () => {
        render(<CreateTask isVisible={true} onClose={() => {}} onTaskCreated={() => {}} />);

        expect(screen.getByTestId('all-day-switch')).toHaveProp('value', false);

        // Toggle the switch to true (set allDayEvent to true)
        fireEvent(screen.getByTestId('all-day-switch'), 'onValueChange', true);

        expect(screen.getByTestId('all-day-switch')).toHaveProp('value', true);
    });

    test('should handle start and end time pickers', async () => {
        const user =userEvent.setup()
       render(<CreateTask isVisible={true} onClose={() => {}} onTaskCreated={() => {}} />);


        expect(screen.getByTestId('start-time-picker-toggle')).toBeOnTheScreen();
        expect(screen.getByTestId('end-time-picker-toggle')).toBeOnTheScreen();

        await user.press(screen.getByTestId('start-time-picker-toggle'));
        await user.press(screen.getByTestId('end-time-picker-toggle'));

    });
});

