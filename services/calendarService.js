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

    async fetchCalendars(token) {
        try {
            const response = await fetch(
                `https://www.googleapis.com/calendar/v3/users/me/calendarList`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.warn('Error fetching calendars:', error);
            return [];
        }
    }

    async fetchAndUpdateEvents(token) {
        try {
            const timeMin = new Date().toISOString();
            const timeMax = new Date();
            timeMax.setDate(timeMax.getDate() + 30);

            const calendars = await this.fetchCalendars(token);
            let allEvents = [];

            for (const calendar of calendars) {
                const response = await fetch(
                    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?timeMin=${timeMin}&timeMax=${timeMax.toISOString()}&orderBy=startTime&singleEvents=true`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                const data = await response.json();
                const events = (data.items || []).map(event => ({
                    ...event,
                    calendarId: calendar.id,
                    calendarSummary: calendar.summary,
                }));
                allEvents = [...allEvents, ...events];
            }

            this.events = allEvents;
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