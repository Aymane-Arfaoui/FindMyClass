import {fetchRoutes} from "@/services/routeService";
import Config from "react-native-config";
const GOOGLE_PLACES_API_KEY = Config.GOOGLE_PLACES_API_KEY;

export async function fetchAllModesData(originStr, destinationStr) {
    const modes = ['DRIVE', 'TRANSIT', 'WALK', 'BICYCLE'];
    const updatedTravelTimes = {
        DRIVE: 'N/A',
        TRANSIT: 'N/A',
        WALK: 'N/A',
        BICYCLE: 'N/A',
    };

    const API_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

    // Convert string coordinates to numbers
    const [originLat, originLng] = originStr.split(",").map(Number);
    const [destinationLat, destinationLng] = destinationStr.split(",").map(Number);

    await Promise.all(
        modes.map(async (mode) => {
            const requestBody = {
                origin: {
                    location: {
                        latLng: {latitude: originLat, longitude: originLng}
                    }
                },
                destination: {
                    location: {
                        latLng: {latitude: destinationLat, longitude: destinationLng}
                    }
                },
                travelMode: mode, // DRIVE, TRANSIT, WALK, BICYCLE
                computeAlternativeRoutes: true,
                languageCode: "en-US",
                units: "METRIC"
            };

            if (mode === "DRIVE") {
                requestBody.routingPreference = "TRAFFIC_AWARE";
            }

            try {
                const resp = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
                        "X-Goog-FieldMask": "routes.legs.duration"
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!resp.ok) {
                    const errorText = await resp.text();
                    console.error(`HTTP Error: ${resp.status} - ${errorText}`);
                    return;
                }

                const data = await resp.json();

                if (!data.routes || data.routes.length === 0) {
                    console.warn(`No valid routes returned for mode: ${mode}`);
                    return;
                }

                // Find the shortest route based on duration
                const bestRoute = data.routes.reduce((shortest, cur) => {
                    const shortestDuration = parseInt(shortest.legs[0].duration.replace("s", ""), 10);
                    const currentDuration = parseInt(cur.legs[0].duration.replace("s", ""), 10);
                    return currentDuration < shortestDuration ? cur : shortest;
                });

                if (!bestRoute.legs || bestRoute.legs.length === 0) {
                    console.warn(`No duration data available for mode: ${mode}`);
                    return;
                }

                // Extract numeric duration value
                const durSec = parseInt(bestRoute.legs[0].duration.replace("s", ""), 10);

                const hours = Math.floor(durSec / 3600);
                const minutes = Math.ceil((durSec % 3600) / 60);

                updatedTravelTimes[mode] = hours > 0 ? `${hours}h ${minutes} min` : `${minutes} min`;

            } catch (err) {
                console.error(`Failed to fetch ${mode}: ${err.message}`);
            }
        })
    );

    return updatedTravelTimes;
}


export const fetchRoutesData = async (origin, destination, mode, setLoading, setRoutes, setFastestRoute) => {
    setLoading(true);
    try {
        const routes = await fetchRoutes(origin, destination, mode);

        if (Array.isArray(routes) && routes.length > 0) {
            routes.sort((a, b) => parseInt(a.duration) - parseInt(b.duration));
            setRoutes(routes);
            setFastestRoute(routes[0]);

        } else {
            setRoutes([]);
            setFastestRoute(null);
        }
    } catch (error) {
        setRoutes([]);
        setFastestRoute(null);
    } finally {
        setLoading(false);
    }
};
export const fetchDirections = async (origin, dest, mode, setTravelTimes, setIsDirectionsView, setLoading, setRoutes, setFastestRoute) => {

    try {
        const originCoords = origin.geometry?.coordinates;
        const destCoords = dest.geometry?.coordinates;

        if (!originCoords || !destCoords) {
            setLoading(false);
            return;
        }

        const formattedOrigin = `${originCoords[1]},${originCoords[0]}`;
        const formattedDestination = `${destCoords[1]},${destCoords[0]}`;

        const times = await fetchAllModesData(formattedOrigin, formattedDestination);
        setTravelTimes(times);
        await fetchRoutesData(formattedOrigin, formattedDestination, mode, setLoading, setRoutes, setFastestRoute);

        setIsDirectionsView(true);
    } catch (error) {
        console.warn(error);
    }
};
export const fetchBuildingData = async (building, lng, lat , setLoading, lastFetchedPlaceId, setLastFetchedPlaceId, setBuildingDetails,setSelectedLocation) => {

    if (!building && (lng === null || lat === null)) {
        console.error("⚠️ No building or coordinates provided.");
        setLoading(false);
        return;
    }

    let placeId = null;
    let buildingLng = lng, buildingLat = lat;

    if (building) {
        buildingLng = building.textPosition ? building.textPosition[0] : lng;
        buildingLat = building.textPosition ? building.textPosition[1] : lat;

        if (building.name === lastFetchedPlaceId) {
            setLoading(false);
            return;
        }

        try {
            const placeSearchUrl = "https://places.googleapis.com/v1/places:searchText";
            const requestBody = {
                textQuery: building.name,
                locationBias: {
                    circle: {
                        center: {
                            latitude: buildingLat,
                            longitude: buildingLng
                        },
                        radius: 2000.0
                    }
                },
                pageSize: 1
            };

            const response = await fetch(placeSearchUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
                    "X-Goog-FieldMask": "places.id"
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (data.places && data.places.length > 0) {
                placeId = data.places[0].id;
                setLastFetchedPlaceId(placeId);
            }
        } catch (error) {

        }
    }

    if (placeId) {
        try {
            const placeDetailsUrl = `https://places.googleapis.com/v1/places/${placeId}`;


            const detailsResponse = await fetch(placeDetailsUrl, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
                    "X-Goog-FieldMask": "displayName,formattedAddress,primaryType,googleMapsUri,photos"
                }
            });

            const detailsData = await detailsResponse.json();


            if (detailsData) {
                setBuildingDetails(detailsData);
            } else {
                setBuildingDetails(null);
            }
        } catch (error) {

            setBuildingDetails(null);
        }
    }

    setSelectedLocation({
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [buildingLng, buildingLat]
        },
        name: building?.name || "Unknown Location"
    });

};




export const fetchPlacesOfInterest = async (category, currentLocation, isFetchingPlaces,setIsFetchingPlaces, setPlaces) => {
    if (!currentLocation || isFetchingPlaces) {
        return;
    }

    setIsFetchingPlaces (true );
    setPlaces([]);

    const {coordinates} = currentLocation.geometry;
    if (!coordinates || coordinates.length !== 2) {
        setIsFetchingPlaces (false);
        return;
    }

    const requestBody = {
        includedTypes: [category],
        maxResultCount: 10,
        locationRestriction: {
            circle: {
                center: {latitude: coordinates[1], longitude: coordinates[0]},
                radius: 1000,
            },
        },
    };

    const url = `https://places.googleapis.com/v1/places:searchNearby`;


    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
                "X-Goog-FieldMask": "places.id,places.displayName,places.location",
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (data.places && data.places.length > 0) {
            const formattedPlaces = data.places.map((place) => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [
                        place.location.longitude,
                        place.location.latitude,
                    ],
                },
                name: place.displayName?.text || "Unnamed Place",
                place_id: place.id || null,
                category: category,
            }));

            setPlaces(formattedPlaces);

        } else {
        }
    } catch (error) {
    } finally {
        setIsFetchingPlaces (false);
    }
};

export const fetchPoI = async (place, setBuildingDetails) => {

    const url = `https://places.googleapis.com/v1/places/${place.place_id}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
                "X-Goog-FieldMask": "displayName,formattedAddress,photos",
            },
        });

        const data = await response.json();

        if (data) {
            setBuildingDetails(data);
        } else {
        }
    } catch (error) {

    }
};