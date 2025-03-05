import {getNextShuttleTime, getShuttleTimes, getShuttleTravelTime} from '../shuttleService';

const mockDate = (date) => {
    global.Date = jest.fn(() => date);
};
describe('getNextShuttleTime', () => {
    let originalDate=global.Date;//store original Date constructor
    //restore  it after each test
    afterEach(() => {
        global.Date = originalDate;
    });

    it('returns the next shuttle time during a weekday (Monday-Thursday)', () => {
        // Monday 9 am
        const date=new Date(2025, 1, 24, 9, 0);
         mockDate(date);
        const nextShuttleTime = getNextShuttleTime();
        expect(nextShuttleTime).toBe('09:15');
    });


    it('returns null on weekends', () => {
        // Saturday
        const date = new Date(2025, 1, 22, 10, 0);
        mockDate(date);

        const nextShuttleTime = getNextShuttleTime();
        expect(nextShuttleTime).toBeNull();
    });

    it('returns the next shuttle time for Friday', () => {
        // friday 10 am
        const date = new Date(2025, 1, 21, 10, 0);
        mockDate(date);

        const nextShuttleTime = getNextShuttleTime();
        expect(nextShuttleTime).toBe('10:15');
    });

    it('returns null if no more shuttles are available today', () => {
        // Thursday 18:45
        const date = new Date(2025, 1, 20, 18, 50);
        mockDate(date);

        const nextShuttleTime = getNextShuttleTime();
        expect(nextShuttleTime).toBeNull(); // No more shuttles available after 18:30 on Thursday
    });
});
describe('getShuttleTimes', () => {
    let originalDate=global.Date;//store original Date constructor
    //restore  it after each test
    afterEach(() => {
        global.Date = originalDate;
    });

    beforeEach(() => {
        // Reset mocks before each test if needed
        jest.clearAllMocks();
    });


    test('returns empty arrays on weekends', () => {
        const saturday = new Date(2025, 2, 1, 10, 0);  // Saturday
        mockDate(saturday);

        const result = getShuttleTimes(3);

        expect(result.nextShuttles).toEqual([]);
        expect(result.allShuttles).toEqual([]);
    });

    test('returns correct shuttles for Monday-Thursday schedule', () => {
        const monday = new Date(2025, 2, 3, 10, 30);
        mockDate(monday);

        const result = getShuttleTimes(3);


        expect(result.nextShuttles).toEqual(['10:45', '11:00', '11:15']);
        expect(result.allShuttles).toHaveLength(35);
        expect(result.allShuttles[0].time).toBe('09:15');
        expect(result.allShuttles[0].isPast).toBe(true);  // '09:15' is in the past
    });

    test('returns correct shuttles for Friday schedule', () => {

        const friday = new Date(2025, 2, 7, 10, 30);
        mockDate(friday);

        const result = getShuttleTimes(3);

        expect(result.nextShuttles).toEqual(['10:45', '11:00', '11:15']);
        expect(result.allShuttles).toHaveLength(23);
        expect(result.allShuttles[0].time).toBe('09:15');
    });

});

describe('getShuttleTravelTime', () => {
    it('returns the correct shuttle travel time', () => {
        expect(getShuttleTravelTime()).toEqual({duration: '30 min', distance: '7.5 km',});
    });
});
