import {getNextShuttleTime, getShuttleTravelTime} from './shuttleService';
import axios from 'axios';
import polyline from '@mapbox/polyline';
import Config from 'react-native-config';
const GOOGLE_MAPS_API_KEY=Config.GOOGLE_MAPS_API_KEY;

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
        console.error(`Error fetching ${mode} routes ${origin} to ${destination}`,);
        return [];
    }
};

export const fetchGoogleRoutes = async (origin, destination, mode) => {
    try {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
            params: {
                origin: `${origin}`, // Convert [lng, lat] to [lat,lng]
                destination: `${destination}`, // Convert [lng, lat] to [lat,lng]
                mode: `${mode}`,
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

            let steps = [];
            route.legs.forEach(leg => {
                leg.steps.forEach(step => {
                    if (mode === "transit" && step.transit_details) {
                        steps.push({
                            instruction: `Take ${step.transit_details.line.short_name} ${step.transit_details.line.name} `
                                + `${step.transit_details.headsign}` +  `\nfrom ${step.transit_details.departure_stop.name} to ${step.transit_details.arrival_stop.name}`,
                            vehicle: step.transit_details.line.vehicle.type,
                            departure_time: step.transit_details.departure_time.text,
                            arrival_time: step.transit_details.arrival_time.text,
                            num_stops: step.transit_details.num_stops
                        });
                    } else {
                        steps.push({
                            instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
                            distance: step.distance.text,
                            maneuver: step.maneuver || "Continue"
                        });
                    }
                });
            });



            return {
                mode,
                distance: route.legs[0].distance.text,
                duration: route.legs[0].duration.text,
                steps,
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
            mode: "shuttle",
            distance: shuttleDetails.distance,
            duration: shuttleDetails.duration,
            departure: nextShuttle
        }];

    } catch (error) {
        console.error("Error fetching shuttle route:", error.message);
        return [];
    }
};
