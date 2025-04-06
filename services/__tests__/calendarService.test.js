import {calendarService} from '../calendarService';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {waitFor} from "@testing-library/react-native";


describe('CalendarService', () => {
    let fetchMock=null;
    beforeEach(() => {
        AsyncStorage.clear();
    });
    afterEach(() => {
        fetchMock.mockRestore();
    });
    const token = 'test_token';

    it('should return cached events if there is an error during fetch', async () => {

        fetchMock = jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network Error'));

        // Initially, no events should be in AsyncStorage
        const storedEventsBefore = await AsyncStorage.getItem("@calendar");
        expect(storedEventsBefore).toBeNull();


        const events = await calendarService.fetchAndUpdateEvents(token);
        expect(events.length).toBe(0);


        const mockEvents = [{ id: 'mock1', summary: 'Mock Event', start: { dateTime: new Date().toISOString() } }];
        await AsyncStorage.setItem('@calendar', JSON.stringify(mockEvents));

        const eventsFromStorage = await calendarService.fetchAndUpdateEvents(token);

        expect(eventsFromStorage.length).toBe(1);
        expect(eventsFromStorage[0].summary).toBe('Mock Event');

    });

    it('should fetch and store events correctly', async () => {

        fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
            json: () => ({
                items: [
                    { id: '1', summary: 'Event 1', start: { dateTime: new Date().toISOString() } },
                    { id: '2', summary: 'Event 2', start: { dateTime: new Date().toISOString() } }
                ]
            })
        });

        await calendarService.fetchAndUpdateEvents(token);


        const storedEvents = await AsyncStorage.getItem("@calendar");
        expect(storedEvents).toBeTruthy();
        const parsedEvents = JSON.parse(storedEvents);
        expect(parsedEvents.length).toBeGreaterThan(0);
        expect(parsedEvents[0].summary).toBe('Event 1');
        expect(parsedEvents[1].summary).toBe('Event 2');
    });



    it('should fetch and store events and notify listeners correctly', async () => {

        fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
            json: () => ({
                items: [
                    { id: '1', summary: 'Event 1', start: { dateTime: "test" } }
                ]
            })
        });

        const listener = jest.fn();
        calendarService.addListener(listener);
        await calendarService.fetchAndUpdateEvents(token);

        await waitFor(()=>{
            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith([
                {calendarColor:'#4285F4', calendarName:'Event 1',id: '1', summary: 'Event 1', start: { dateTime: 'test' } }
            ]);
        })



        calendarService.removeListener(listener)
    });
});
