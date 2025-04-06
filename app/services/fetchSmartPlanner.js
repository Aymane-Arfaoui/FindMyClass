import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalDateString } from '@/components/EventList';

export const getEventsAndTasks = async (selectedDate, selectedCalendars, theme) => {
    const storedUser = await AsyncStorage.getItem("@user");
    if (!storedUser) {
        return { events: [], tasks: [], availableCalendars: [] };
    }

    const storedEvents = await AsyncStorage.getItem("@calendar");
    const storedTasks = await AsyncStorage.getItem("tasks");

    let events = [];
    let tasks = [];
    let availableCalendars = [];

    if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents);
        availableCalendars = [...new Set(parsedEvents.map(event => event.calendarName || 'Main'))];

        if (Object.keys(selectedCalendars).length === 0) {
            const initialCalendars = availableCalendars.reduce((acc, cal) => ({ ...acc, [cal]: true }), {});
            return { events: [], tasks: [], availableCalendars, initialCalendars };
        }

        events = parsedEvents.filter(event => {
            const eventDate = event.start?.date || getLocalDateString(event.start?.dateTime);
            const calendarName = event.calendarName || 'Main';
            return eventDate === selectedDate && selectedCalendars[calendarName];
        }).map(event => ({
            ...event,
            itemType: 'event',
            calendarName: event.calendarName || 'Main',
            calendarColor: event.calendarColor || theme.colors.blueDark
        }));
    }

    if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        tasks = parsedTasks.filter(task => {
            const taskDate = getLocalDateString(task.date);
            return taskDate === selectedDate;
        }).map(task => ({
            itemType: 'task',
            summary: task.taskName,
            description: task.notes,
            location: task.address,
            start: task.allDayEvent
                ? { date: getLocalDateString(task.date) }
                : { dateTime: task.startTime },
            end: task.allDayEvent
                ? { date: getLocalDateString(task.date) }
                : { dateTime: task.endTime },
            allDayEvent: task.allDayEvent,
            id: task.id
        }));
    }

    return { events, tasks, availableCalendars };
};
