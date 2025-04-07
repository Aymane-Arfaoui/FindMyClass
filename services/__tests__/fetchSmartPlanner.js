import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEventsAndTasks } from '../fetchSmartPlanner';


jest.mock('@/components/EventList', () => ({
    getLocalDateString: jest.fn((date) => date),
}));

describe('getEventsAndTasks', () => {
    const mockTheme = {
        colors: {
            blueDark: '#0000ff',
        },
    };

    beforeEach(() => {
        AsyncStorage.clear();
    });

    it('should return empty arrays when no user is found', async () => {
        const result = await getEventsAndTasks('2023-01-01', {}, mockTheme);
        expect(result).toEqual({
            events: [],
            tasks: [],
            availableCalendars: [],
        });
    });

    it('should return initialCalendars when no calendars are selected', async () => {
        const mockEvents = [
            { start: { date: '2023-01-01' }, calendarName: 'Work' },
            { start: { date: '2023-01-02' }, calendarName: 'Personal' },
        ];

        await AsyncStorage.setItem("@user",JSON.stringify({ id: 1 }));
        await AsyncStorage.setItem("@calendar",JSON.stringify(mockEvents));

        const result = await getEventsAndTasks('2023-01-01', {}, mockTheme);
        expect(result.initialCalendars).toEqual({
            Work: true,
            Personal: true,
        });
    });

    it('should filter events by selected date and calendars', async () => {
        const mockEvents = [
            { start: { date: '2023-01-01' }, calendarName: 'Work' },
            { start: { date: '2023-01-01' }, calendarName: 'Personal' },
            { start: { date: '2023-01-02' }, calendarName: 'Work' },
        ];

        await AsyncStorage.setItem("@user",JSON.stringify({ id: 1 }));
        await AsyncStorage.setItem("@calendar",JSON.stringify(mockEvents));

        const selectedCalendars = { Work: true, Personal: false };
        const result = await getEventsAndTasks('2023-01-01', selectedCalendars, mockTheme);

        expect(result.events.length).toBe(1);
        expect(result.events[0].calendarName).toBe('Work');
        expect(result.availableCalendars).toEqual(['Work', 'Personal']);
    });

    it('should filter tasks by selected date', async () => {
        const mockTasks = [
            { date: '2023-01-01', taskName: 'Task 1', allDayEvent: true },
            { date: '2023-01-02', taskName: 'Task 2', allDayEvent: true },
        ];

        await AsyncStorage.setItem("@user",JSON.stringify({ id: 1 }));
        await AsyncStorage.setItem("tasks", JSON.stringify(mockTasks));

        const result = await getEventsAndTasks('2023-01-01', {}, mockTheme);
        expect(result.tasks.length).toBe(1);
        expect(result.tasks[0].summary).toBe('Task 1');
    });

    it('should transform event and task objects correctly', async () => {
        const mockEvents = [
            {
                start: { date: '2023-01-01' },
                summary: 'Event 1',
                calendarName: 'Work'
            },
        ];
        const mockTasks = [
            {
                date: '2023-01-01',
                taskName: 'Task 1',
                notes: 'Notes',
                address: 'Location',
                allDayEvent: true,
                id: 'task-1'
            },
        ];

        await AsyncStorage.setItem("@user",JSON.stringify({ id: 1 }));
        await AsyncStorage.setItem("@calendar",JSON.stringify(mockEvents));
        await AsyncStorage.setItem("tasks", JSON.stringify(mockTasks));

        const result = await getEventsAndTasks('2023-01-01', { Work: true }, mockTheme);

        // Test event transformation
        expect(result.events[0]).toEqual({
            start: { date: '2023-01-01' },
            summary: 'Event 1',
            calendarName: 'Work',
            itemType: 'event',
            calendarColor: '#0000ff',
        });

        // Test task transformation
        expect(result.tasks[0]).toEqual({
            itemType: 'task',
            summary: 'Task 1',
            description: 'Notes',
            location: 'Location',
            start: { date: '2023-01-01' },
            end: { date: '2023-01-01' },
            allDayEvent: true,
            id: 'task-1'
        });
    });

    it('should handle events without calendarName', async () => {
        const mockEvents = [
            { start: { date: '2023-01-01' }, summary: 'Event 1' },
        ];

        await AsyncStorage.setItem("@user",JSON.stringify({ id: 1 }));
        await AsyncStorage.setItem("@calendar",JSON.stringify(mockEvents));

        const result = await getEventsAndTasks('2023-01-01', { Main: true }, mockTheme);
        expect(result.events[0].calendarName).toBe('Main');
        expect(result.availableCalendars).toEqual(['Main']);
    });

    it('should handle tasks with dateTime fields', async () => {
        const mockTasks = [
            {
                date: '2023-01-01',
                taskName: 'Task 1',
                allDayEvent: false,
                startTime: '2023-01-01T10:00:00',
                endTime: '2023-01-01T11:00:00',
                id: 1,
                notes:"",
            },
        ];

        await AsyncStorage.setItem("@user",JSON.stringify({ id: 1 }));
        await AsyncStorage.setItem("tasks", JSON.stringify(mockTasks));

        const result = await getEventsAndTasks('2023-01-01', {}, mockTheme);
        expect(result.tasks[0].start).toEqual({ dateTime: '2023-01-01T10:00:00' });
        expect(result.tasks[0].end).toEqual({ dateTime: '2023-01-01T11:00:00' });
    });
});