import { getCalendarEvents } from '../calendarService'; // Adjust path as necessary

fetch = jest.fn();

describe('getCalendarEvents', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return events if the API request is successful', async () => {
        const mockResponse = {
            items: [
                { summary: 'Event 1', start: { dateTime: '2025-02-10T10:00:00' } },
                { summary: 'Event 2', start: { dateTime: '2025-02-11T11:00:00' } },
            ],
        };
        fetch.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce(mockResponse),
        });

        const result = await getCalendarEvents('test');
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('https://www.googleapis.com/calendar/v3/calendars/primary/events'),
            expect.objectContaining({
                headers: { Authorization: 'Bearer test' },
            })
        );
        expect(result).toEqual(mockResponse.items);
    });

    it('should return an empty array if the request fails', async () => {
       //spying on console warn to catch the warning
        const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        fetch.mockRejectedValueOnce(new Error('error'));
        const result = await getCalendarEvents('test');
        expect(result).toEqual([]);

        expect(spy).toHaveBeenCalled();
        spy.mockRestore()
    });

    it('should return an empty array if the  response is empty', async () => {
        const mockResponse = {};
        fetch.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce(mockResponse),
        });
        const result = await getCalendarEvents('test');
        expect(result).toEqual([]);
    });
});