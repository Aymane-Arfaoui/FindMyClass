import React, {useEffect, useRef, useState} from 'react';
import {Animated, PanResponder, StatusBar, StyleSheet, TouchableOpacity, View} from 'react-native';
import Map from '../components/Map';
import {fetchRoutes} from '@/services/routeService';
import {getUserLocation} from '@/services/userService';
import BuildingDetailsPanel from "@/components/BuildingDetailsPanel";
import {theme} from "@/constants/theme";
import MapButtons from "@/components/MapButtons";
import MainSearchBar from "@/components/MainSearchBar";
import LiveLocationButton from '@/components/LiveLocationButton';
import SearchBars from '@/components/SearchBars';
import BottomPanel from "@/components/BottomPanel";
import Config from 'react-native-config';
import {useRouter} from 'expo-router';
import {Ionicons} from "@expo/vector-icons";
import PlaceFilterButtons from "@/components/PlaceFilterButtons";
import AppNavigationPannel from "@/components/AppNavigationPannel";
import { useLocalSearchParams } from 'expo-router';





const GOOGLE_PLACES_API_KEY = Config.GOOGLE_PLACES_API_KEY;

export default function Homemap() {
    const router = useRouter();
    const [buildingDetails, setBuildingDetails] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [routes, setRoutes] = useState([]);
    const [fastestRoute, setFastestRoute] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [centerCoordinate, setCenterCoordinate] = useState([-73.5789, 45.4960]);
    const cameraRef = useRef(null);
    const [isDirectionsView, setIsDirectionsView] = useState(false);
    const [modeSelected, setModeSelected] = useState('walking');
    const panelY = useRef(new Animated.Value(500)).current;
    const [currentOrigin, setCurrentOrigin] = useState(null);
    const [currentDestination, setCurrentDestination] = useState(null);
    const [places, setPlaces] = useState([]);
    // Cache implementation to reduce api calls
    const [placeDetailsCache, setPlaceDetailsCache] = useState({});

    const [wantsClassroom, setWantsClassroom] = useState(false);


    const params = useLocalSearchParams();
    const {
        lat = null,
        lng = null,
        room = null,
        address = null,
        directionsTriggered = null,
        fromCalendar = null,
    } = useLocalSearchParams();


    const [destinationAddress, setDestinationAddress] = useState(null);
    const [hasTriggeredDirections, setHasTriggeredDirections] = useState(false);



    useEffect(() => {
        if (lat && lng) {
            const parsedLat = parseFloat(lat);
            const parsedLng = parseFloat(lng);
            const decodedAddress = address ? decodeURIComponent(address) : null;

            const destinationPoint = {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [parsedLng, parsedLat],
                },
                name: decodedAddress || "Selected Location",
            };

            setSelectedLocation(destinationPoint);
            setCurrentDestination(destinationPoint);
            setDestinationAddress(decodedAddress);
        }
    }, [lat, lng, address]);

    useEffect(() => {
        if (
            directionsTriggered === 'true' &&
            !hasTriggeredDirections &&
            currentLocation?.geometry?.coordinates &&
            currentDestination?.geometry?.coordinates
        ) {
            setHasTriggeredDirections(true);
            handleDirectionPress(currentLocation, currentDestination, modeSelected, fromCalendar === 'true');
        }
    }, [directionsTriggered, currentLocation, currentDestination, modeSelected, hasTriggeredDirections]);


    useEffect(() => {
        let isMounted = true;
        const fetchInitialLocation = async () => {
            try {
                const location = await getUserLocation();
                if (isMounted) {
                    setCurrentLocation({
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [location.lng, location.lat],
                        },
                    });
                    setCenterCoordinate([location.lng, location.lat]);
                }
            } catch (error) {
                console.error("Error fetching user location:", error);
            }
        };
        fetchInitialLocation();
        const interval = setInterval(async () => {
            try {
                const location = await getUserLocation();
                if (isMounted) {
                    setCurrentLocation({
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [location.lng, location.lat],
                        },
                    });
                }
            } catch (error) {
                console.error("Error fetching user location in interval:", error);
            }
        }, 5000);
        return () => {
            clearInterval(interval);
            isMounted = false;
        };
    }, [selectedLocation, modeSelected]);

    async function fetchAllModesData(originStr, destinationStr) {
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
                            latLng: { latitude: originLat, longitude: originLng }
                        }
                    },
                    destination: {
                        location: {
                            latLng: { latitude: destinationLat, longitude: destinationLng }
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

    const [travelTimes, setTravelTimes] = useState({
        driving: 'N/A',
        transit: 'N/A',
        walking: 'N/A',
        bicycling: 'N/A'
    });


    const fetchRoutesData = async (origin, destination, mode) => {
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
    const handleDirectionPress = async (origin, dest, mode, wantsClassroom) => {
        setLoading(true);
        setCurrentOrigin(origin);
        setCurrentDestination(dest);
        setWantsClassroom(wantsClassroom);

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
            await fetchRoutesData(formattedOrigin, formattedDestination, mode);

            setIsDirectionsView(true);
        } catch (error) {
            console.warn(error);
        } finally {
            setLoading(false);
        }
    };
    const handleRoutePress = (route) => {
        setFastestRoute(route);
    };

    const switchToRegularMapView = (bool) => {
        setRoutes([]);
        setFastestRoute(null);
        setIsDirectionsView(bool);
    };


    useEffect(() => {
        if (isDirectionsView && currentOrigin && currentDestination) {
            const originCoords = currentOrigin.geometry?.coordinates; // [lng, lat]
            const destCoords = currentDestination.geometry?.coordinates; // [lng, lat]
            const formattedO = `${originCoords[1]},${originCoords[0]}`;
            const formattedD = `${destCoords[1]},${destCoords[0]}`;

            fetchRoutesData(formattedO, formattedD, modeSelected);
        }
    }, [modeSelected, currentOrigin, currentDestination]);

    const [lastFetchedPlaceId, setLastFetchedPlaceId] = useState(null);

    const handleBuildingPress = async (building = null, lng = null, lat = null) => {
        setLoading(true);

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
                } else {

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

        Animated.timing(panelY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
        }).start();

        setLoading(false);
    };


    const handleClosePanel = () => {
        Animated.timing(panelY, {
            toValue: 500,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setBuildingDetails(null);
            // setRoutes([]);
            // setFastestRoute(null);
            panelY.setValue(500);
        });
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (event, gesture) => {
                if (gesture.dy > 0) {
                    panelY.setValue(gesture.dy);
                }
            },
            onPanResponderRelease: (event, gesture) => {
                if (gesture.dy > 100) {
                    handleClosePanel();
                } else {
                    Animated.spring(panelY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    let isFetchingPlaces = false; // Prevent multiple requests

    const fetchPlacesOfInterest = async (category) => {
        if (!currentLocation || isFetchingPlaces) {
            return;
        }

        isFetchingPlaces = true;
        setPlaces([]);

        const {coordinates} = currentLocation.geometry;
        if (!coordinates || coordinates.length !== 2) {
            isFetchingPlaces = false;
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
            isFetchingPlaces = false;
        }
    };

    const handlePOIPress = async (place) => {
        if (!place || !place.place_id) {
            return;
        }

        setSelectedLocation(place);

        Animated.timing(panelY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();

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


    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content"/>
            <Map
                onBuildingPress={handleBuildingPress}
                selectedLocation={selectedLocation}
                userLocation={currentLocation}
                routes={routes}
                selectedRoute={fastestRoute}
                onMapPress={handleClosePanel}
                cameraRef={cameraRef}
                centerCoordinate={selectedLocation?.geometry?.coordinates || centerCoordinate}
                onRoutePress={handleRoutePress}
                places={places}
                onSelectedPOI={handlePOIPress}
            />

            {!isDirectionsView && (
                <View style={styles.searchContainer}>
                    {/* Back Button */}
                    <TouchableOpacity style={styles.backButton} onPress={() => router.push('/Welcome')}>
                        <Ionicons name="chevron-back" size={28} color="black"/>
                    </TouchableOpacity>

                    {/* Search Bar */}
                    <View style={styles.searchWrapper}>
                        <MainSearchBar
                            onLocationSelect={setSelectedLocation}
                            onBuildingPress={handleBuildingPress}
                        />
                    </View>

                    {/* Filter Button (Now Functional) */}
                    <PlaceFilterButtons
                        onSelectCategory={(category) => {
                            if (category) {
                                fetchPlacesOfInterest(category);
                            } else {
                                setPlaces([]);
                            }
                        }}
                    />
                </View>
            )}

            {!isDirectionsView && (
                <View style={styles.mapButtonsContainer}>
                    <MapButtons
                        onPress={(location) => {
                            setSelectedLocation({
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: location,
                                },
                            });
                            handleClosePanel();
                        }}
                    />
                </View>
            )}
            {!isDirectionsView && (
                <LiveLocationButton onPress={setSelectedLocation}/>
            )}
            {!isDirectionsView && (
                <AppNavigationPannel/>
            )}

            {selectedLocation && !isDirectionsView && (
                <BuildingDetailsPanel
                    currentLocation={currentLocation}
                    selectedBuilding={selectedLocation}
                    buildingDetails={buildingDetails}
                    loading={loading}
                    panelY={panelY}
                    panHandlers={panResponder.panHandlers}
                    onClose={handleClosePanel}
                    onDirectionPress={handleDirectionPress}
                    GOOGLE_PLACES_API_KEY={GOOGLE_PLACES_API_KEY}
                    mode={modeSelected}
                />
            )}


            {isDirectionsView && (
                <>
                    <SearchBars
                        currentLocation={currentLocation}
                        destination={destinationAddress || buildingDetails?.formattedAddress}
                        onBackPress={() => switchToRegularMapView(false)}
                        modeSelected={modeSelected}
                        setModeSelected={setModeSelected}
                        travelTimes={travelTimes}
                    />


                    <BottomPanel
                        transportMode={modeSelected}
                        routeDetails={fastestRoute}
                        routes={routes}
                        wantsClassroom={wantsClassroom}
                        selectedBuilding={selectedLocation}
                        travelTimes={travelTimes}
                        startLocation={currentOrigin && currentOrigin.geometry?.coordinates ? {
                            lat: currentOrigin.geometry.coordinates[1],
                            lng: currentOrigin.geometry.coordinates[0],
                        } : undefined}
                        endLocation={currentDestination && currentDestination.geometry?.coordinates ? {
                            lat: currentDestination.geometry.coordinates[1],
                            lng: currentDestination.geometry.coordinates[0],
                        } : undefined}
                    />
                </>
            )}

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: StatusBar.currentHeight || 0,
        position: 'relative',
    },

    infoBox: {
        position: 'absolute',
        bottom: 20,
        left: 10,
        right: 10,
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5
    },
    mapButtonsContainer: {
        position: 'absolute',
        bottom: 830,
        left: 0,
        right: 0,
        zIndex: 10,
        alignItems: 'center',
    },
    searchContainer: {
        position: "absolute",
        top: 70,
        left: 10,
        right: 10,
        zIndex: 20,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 30,
        paddingHorizontal: 10,
        elevation: 5,
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    backButton: {
        marginTop: 1,
        padding: 2,
        marginRight: 1,
        marginLeft: -7,
    },
    searchWrapper: {
        flex: 1,
    },
    filterButton: {
        backgroundColor: theme.colors.primary,
        width: 40,
        height: 40,
        marginTop: 50,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 2,
    },
    header: {fontSize: 18, fontWeight: "bold"},
    routeCard: {padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd'},
    routeMode: {fontSize: 16, fontWeight: "bold"},
    noRoutes: {textAlign: "center", color: "gray", marginTop: 10}
});


const getCentroid = (polygon) => {
    let x = 0, y = 0, n = polygon.length;

    polygon.forEach(([lng, lat]) => {
        x += lng;
        y += lat;
    });

    return [x / n, y / n];
};
