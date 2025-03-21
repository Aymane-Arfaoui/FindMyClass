export const getCalendarEvents = async (token) => {
    try {
        const timeMin = new Date().toISOString();
        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 7); // Get events for next 7 days

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
        const allEvents = allEventsArrays.flat();
        console.log('Total events found across all calendars:', allEvents.length);
        
        // Sort events by start time
        const sortedEvents = allEvents.sort((a, b) => {
            const aTime = new Date(a.start?.dateTime || a.start?.date);
            const bTime = new Date(b.start?.dateTime || b.start?.date);
            return aTime - bTime;
        });

        console.log('Events after sorting:', sortedEvents.map(event => ({
            summary: event.summary,
            calendar: event.calendarName,
            start: event.start?.dateTime || event.start?.date
        })));

        return sortedEvents;
    } catch (error) {
        console.warn('Calendar fetch error:', error);
        return [];
    }
};