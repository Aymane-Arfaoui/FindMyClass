import { getNextShuttleTime, getShuttleTravelTime } from '../shuttleService';

describe('getNextShuttleTime', () => {
    let originalDate=global.Date;//store original Date constructor
    //restore  it after each test
    afterEach(() => {
        global.Date = originalDate;
    });

    it('returns the next shuttle time during a weekday (Monday-Thursday)', () => {
        // Monday 9 am
        const date=new Date(2025, 1, 24, 9, 0);
        global.Date = jest.fn(() =>date );

        const nextShuttleTime = getNextShuttleTime();
        expect(nextShuttleTime).toBe('09:15');
    });


    it('returns null on weekends', () => {
        // Saturday
        const date = new Date(2025, 1, 22, 10, 0);
        global.Date = jest.fn(() => date);

        const nextShuttleTime = getNextShuttleTime();
        expect(nextShuttleTime).toBeNull();
    });

    it('returns the next shuttle time for Friday', () => {
        // friday 10 am
        const date = new Date(2025, 1, 21, 10, 0);
        global.Date = jest.fn(() =>date );

        const nextShuttleTime = getNextShuttleTime();
        expect(nextShuttleTime).toBe('10:15');
    });

    it('returns null if no more shuttles are available today', () => {
        // Thursday 18:45
        const date = new Date(2025, 1, 20, 18, 50);
        global.Date = jest.fn(() => date);

        const nextShuttleTime = getNextShuttleTime();
        expect(nextShuttleTime).toBeNull(); // No more shuttles available after 18:30 on Thursday
    });
});

describe('getShuttleTravelTime', () => {
    it('returns the correct shuttle travel time', () => {
        expect(getShuttleTravelTime()).toEqual({duration: '30 min', distance: '7.5 km',});
    });
});
