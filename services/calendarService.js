import AsyncStorage from "@react-native-async-storage/async-storage";

class CalendarService {
    static instance = null;

    static getInstance() {
        if (!CalendarService.instance) {
            CalendarService.instance = new CalendarService();
        }
        return CalendarService.instance;
    }

    constructor() {
        this.listeners = new Set();
        this.events = [];
    }

    addListener(listener) {
        this.listeners.add(listener);
    }

    removeListener(listener) {
        this.listeners.delete(listener);
    }

    notifyListeners() {
        this.listeners.forEach(listener => listener(this.events));
    }

    async fetchAndUpdateEvents(token) {
        try {
            const timeMin = new Date().toISOString();
            const timeMax = new Date();
            timeMax.setDate(timeMax.getDate() + 30); // Get events for next 30 days

            console.log('Fetching calendar list...');
            // First, get list of all calendars
            const calendarListResponse = await fetch(
                'https://www.googleapis.com/calendar/v3/users/me/calendarList',
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const calendarList = await calendarListResponse.json();
            console.log('Found calendars:', calendarList.items.map(cal => cal.summary));
            
            // Fetch events from each calendar
            const allEventsPromises = calendarList.items.map(async (calendar) => {
                console.log(`Fetching events from calendar: ${calendar.summary}`);
                const response = await fetch(
                    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?timeMin=${timeMin}&timeMax=${timeMax.toISOString()}&orderBy=startTime&singleEvents=true`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                const data = await response.json();
                console.log(`Found ${data.items?.length || 0} events in calendar: ${calendar.summary}`);
                // Add calendar source information to each event
                return (data.items || []).map(event => ({
                    ...event,
                    calendarName: calendar.summary,
                    calendarColor: calendar.backgroundColor || '#4285F4'
                }));
            });

            // Wait for all calendar events to be fetched
            const allEventsArrays = await Promise.all(allEventsPromises);
            
            // Combine all events into a single array
            this.events = allEventsArrays.flat().sort((a, b) => {
                const aTime = new Date(a.start?.dateTime || a.start?.date);
                const bTime = new Date(b.start?.dateTime || b.start?.date);
                return aTime - bTime;
            });

            await AsyncStorage.setItem("@calendar", JSON.stringify(this.events));
            this.notifyListeners();
            return this.events;

        } catch (error) {
            console.warn('Calendar fetch error:', error);
            const storedEvents = await AsyncStorage.getItem("@calendar");
            if (storedEvents) {
                this.events = JSON.parse(storedEvents);
            }
            this.notifyListeners();
            return this.events;
        }
    }

    getEvents() {
        return this.events;
    }
}

export const calendarService = CalendarService.getInstance();
