import { getNextShuttleTime, getShuttleTravelTime } from './shuttleService';
import axios from 'axios';
import polyline from '@mapbox/polyline';
import { GOOGLE_MAPS_API_KEY } from '@env';
export const fetchRoutes = async (origin, destination, mode) => {
    try {
        if (!origin || !destination) throw new Error("Invalid origin or destination");

        if (mode === "transit") {
            const [transitRoutes, shuttleRoute] = await Promise.all([
                fetchGoogleRoutes(origin, destination, mode),
                fetchShuttleRoute(origin, destination)
            ]);

            return [...transitRoutes, ...shuttleRoute].sort((a, b) => parseInt(a.duration) - parseInt(b.duration));
        }

        return fetchGoogleRoutes(origin, destination, mode);

    } catch (error) {
        console.error(`Error fetching ${mode} routes ${origin} to ${destination}`, );
        return [];
    }
};

const fetchGoogleRoutes = async (origin, destination, mode) => {
    try {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
            params: {
                origin: `${origin[1]},${origin[0]}`, // Convert [lng, lat] to [lat,lng]
                destination: `${destination[1]},${destination[0]}`, // Convert [lng, lat] to [lat,lng]
                mode,
                alternatives: true,
                key: GOOGLE_MAPS_API_KEY
            }
        });

        if (response.data.status !== "OK") throw new Error(response.data.error_message);

        return response.data.routes.map(route => {
            const encoded = route.overview_polyline?.points;
            // Decode the polyline into an array of [lat, lng] pairs
            const decodedCoords = polyline.decode(encoded);
            // Convert to [lng, lat] order as required by GeoJSON
            const coordinates = decodedCoords.map(([lat, lng]) => [lng, lat]);
            return {
              mode,
              distance: route.legs[0].distance.text,
              duration: route.legs[0].duration.text,
              // Use a valid GeoJSON Feature to represent the route
              routeGeoJSON: {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates
                },
                properties: {}
              }
            };
          });

    } catch (error) {
        console.error(`Error fetching Google ${mode} routes from ${origin} to ${destination}`, error.message);
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
