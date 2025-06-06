const SHUTTLE_SCHEDULE = {
    "Monday-Thursday": [
        "09:15", "09:30", "09:45", "10:00", "10:15", "10:30",
        "10:45", "11:00", "11:15", "11:30", "12:15", "12:30",
        "12:45", "13:00", "13:15", "13:30", "13:45", "14:00",
        "14:15", "14:30", "14:45", "15:00", "15:15", "15:30",
        "16:00", "16:15", "16:30", "16:45", "17:00", "17:15",
        "17:30", "17:45", "18:00", "18:15", "18:30"
    ],
    "Friday": [
        "09:15", "09:30", "09:45", "10:15", "10:45", "11:00",
        "11:15", "12:00", "12:15", "12:45", "13:00", "13:15",
        "13:45", "14:15", "14:30", "14:45", "15:15", "15:30",
        "15:45", "16:45", "17:15", "17:45", "18:15"
    ]
};

export const getNextShuttleTime = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const today = now.getDay();

    const scheduleType = (today >= 1 && today <= 4) ? "Monday-Thursday" : (today === 5 ? "Friday" : null);
    if (!scheduleType) return null; // if on weekend

    for (const time of SHUTTLE_SCHEDULE[scheduleType]) {
        const [hh, mm] = time.split(":").map(Number);
        const shuttleTime = hh * 60 + mm;

        if (shuttleTime > currentTime) {
            // console.log(`Next shuttle found at ${time}`);
            return time;
        }
    }
    // console.log("No more shuttles today.------");
    return null;
};

export const isShuttleRunningNow = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const today = now.getDay();

    const scheduleType = (today >= 1 && today <= 4) ? "Monday-Thursday" : (today === 5 ? "Friday" : null);
    if (!scheduleType) return false; // weekend

    const times = SHUTTLE_SCHEDULE[scheduleType];
    const firstTime = times[0].split(":").map(Number);
    const lastTime = times[times.length - 1].split(":").map(Number);

    const firstShuttle = firstTime[0] * 60 + firstTime[1];
    const lastShuttle = lastTime[0] * 60 + lastTime[1];

    return currentTime >= firstShuttle && currentTime <= lastShuttle;
};

export const getShuttleTimes = (count) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const today = now.getDay();

    const scheduleType = (today >= 1 && today <= 4) ? "Monday-Thursday" : (today === 5 ? "Friday" : null);
    if (!scheduleType) return { nextShuttles: [], allShuttles: [] }; // if it's the weekend

    const allShuttles = [];

    for (const time of SHUTTLE_SCHEDULE[scheduleType]) {
        const [hh, mm] = time.split(":").map(Number);
        const shuttleTime = hh * 60 + mm;

        allShuttles.push({
            time,
            shuttleTime,
            isPast: shuttleTime < currentTime
        });
    }

    const sortedShuttles = allShuttles.sort((a, b) => a.shuttleTime - b.shuttleTime);

    const nextShuttles = [];
    let previousShuttle = null;

    for (const shuttle of sortedShuttles) {
        if (shuttle.shuttleTime > currentTime && nextShuttles.length < count) {
            nextShuttles.push(shuttle.time);
        }
        if (shuttle.shuttleTime < currentTime && !previousShuttle) {
            previousShuttle = shuttle.time;
        }
    }

    return { nextShuttles, allShuttles };
};




export const getShuttleTravelTime = () => ({
    duration: "30 min",
    distance: "7.5 km"
});
