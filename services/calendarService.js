export const getCalendarEvents = async (token) => {
    try {
      const timeMin = new Date().toISOString();
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 7); // Get events for next 7 days

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax.toISOString()}&orderBy=startTime&singleEvents=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.warn('Calendar fetch error:', error);
      return [];
    }
  };