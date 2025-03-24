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

            const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax.toISOString()}&orderBy=startTime&singleEvents=true`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const data = await response.json();
            this.events = data.items || [];

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