import { getNextShuttleTime, getShuttleTravelTime } from './shuttleService';
import axios from 'axios';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAPdmd0FumLk8snfLYCijEEMAMsitIHoAg'

export const fetchRoutes = async (origin, destination, mode = "walking") => {
    try {
        if (!origin || !destination) throw new Error("Invalid origin or destination");
        if (!mode) mode = "walking";

        if (mode === "transit") {
            const [transitRoutes, shuttleRoute] = await Promise.all([
                fetchGoogleRoutes(origin, destination, "transit"),
                fetchShuttleRoute(origin, destination)
            ]);

            return [...transitRoutes, ...shuttleRoute].sort((a, b) => parseInt(a.duration) - parseInt(b.duration));
        }

        return fetchGoogleRoutes(origin, destination, mode);

    } catch (error) {
        console.error(`Error fetching ${mode} routes:`, error.message);
        return [];
    }
};

const fetchGoogleRoutes = async (origin, destination, mode) => {
    try {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
            params: {
                origin: `${origin}`,
                destination: `${destination}`,
                mode: `${mode}`,
                alternatives: true,
                key: GOOGLE_MAPS_API_KEY
            }
        });

        if (response.data.status !== "OK") throw new Error(response.data.error_message);

        return response.data.routes.map(route => ({
            mode,
            distance: route.legs[0].distance.text,
            duration: route.legs[0].duration.text,
            polyline: route.overview_polyline?.points || null
        }));

    } catch (error) {
        console.error(`Error fetching Google ${mode} routes:`, error.message);
        return [];
    }
};

const fetchShuttleRoute = async (origin, destination) => {
    try {
        const nextShuttle = getNextShuttleTime();
        if (!nextShuttle) return [];

        const shuttleDetails = getShuttleTravelTime();
        return [{
            mode: "transit (shuttle)",
            distance: shuttleDetails.distance,
            duration: shuttleDetails.duration,
            departure: nextShuttle
        }];

    } catch (error) {
        console.error("Error fetching shuttle route:", error.message);
        return [];
    }
};

