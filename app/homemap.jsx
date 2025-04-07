import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Animated, PanResponder, StatusBar, StyleSheet, TouchableOpacity, View} from 'react-native';
import Map from '../components/Map';
import {fetchRoutes} from '@/services/routeService';
import {getUserLocation} from '@/services/userService';
import BuildingDetailsPanel from "@/components/BuildingDetailsPanel";
import MapButtons from "@/components/MapButtons";
import MainSearchBar from "@/components/MainSearchBar";
import LiveLocationButton from '@/components/LiveLocationButton';
import SearchBars from '@/components/SearchBars';
import BottomPanel from "@/components/BottomPanel";
import ChatBotButton from '@/components/ChatBotButton';
import Config from 'react-native-config';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from "@expo/vector-icons";
import PlaceFilterButtons from "@/components/PlaceFilterButtons";
import AppNavigationPannel from "@/components/AppNavigationPannel";
import {ThemeContext} from "@/context/ThemeProvider";
import {
    fetchPoI,
    fetchPlacesOfInterest,
    fetchBuildingData,
    fetchRoutesData,
    fetchDirections
} from '../services/fetchingService.js'


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
    const [isFetchingPlaces, setIsFetchingPlaces] = useState(false);
    const [modeSelected, setModeSelected] = useState('walking');
    const panelY = useRef(new Animated.Value(500)).current;
    const [currentOrigin, setCurrentOrigin] = useState(null);
    const [currentDestination, setCurrentDestination] = useState(null);
    const [places, setPlaces] = useState([]);
    const [placeDetailsCache, setPlaceDetailsCache] = useState({});

    const [wantsClassroom, setWantsClassroom] = useState(false);
    const { theme, isDark } = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);


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

    const [selectedCampus, setSelectedCampus] = useState('SGW');

    useEffect(() => {
        if (selectedCampus) {
            handleClosePanel();
            setBuildingDetails(null);
        }
    }, [selectedCampus]);

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

    const [classroomNumber, SetClassroomNumber] = useState(false);

    const hasTriggeredRoute = useRef(false);

    const BUILDING_COORDINATES = {
        'Hall': [-73.5789, 45.4960],
        'MB': [-73.5790, 45.4950],
        'CC': [-73.6396, 45.45861],
    };

    useEffect(() => {
        const { startBuilding,
            endBuilding,
            triggerRoute,
            destinationClassroom } = params;

        if (triggerRoute === 'true' && startBuilding && endBuilding && !hasTriggeredRoute.current) {
            const startCoords = BUILDING_COORDINATES[startBuilding];
            const endCoords = BUILDING_COORDINATES[endBuilding];

            if (startCoords && endCoords) {
                const origin = {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: startCoords,
                    },
                    name: startBuilding,
                };
                const destination = {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: endCoords,
                    },
                    name: endBuilding,
                };
                // const [wantsClassroom, setWantsClassroom] = useState(false);
                // const [classroomNumber, SetClassroomNumber] = useState(false);

                setWantsClassroom(true);
                // SetClassroomNumber(destinationClassroom);
                handleDirectionPress(origin, destination, "walking", true, destinationClassroom);
                hasTriggeredRoute.current = true;
                // const handleDirectionPress = async (origin, dest, mode, wantsClassroom, classroom) => {
                // onDirectionPress(currentLocation, selectedBuilding, mode, true, CLASSROOM_CONSTANT);


            }
        }
    }, [params.startBuilding, params.endBuilding, params.triggerRoute, modeSelected]);



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

                    const bestRoute = data.routes.reduce((shortest, cur) => {
                        const shortestDuration = parseInt(shortest.legs[0].duration.replace("s", ""), 10);
                        const currentDuration = parseInt(cur.legs[0].duration.replace("s", ""), 10);
                        return currentDuration < shortestDuration ? cur : shortest;
                    });

                    if (!bestRoute.legs || bestRoute.legs.length === 0) {
                        console.warn(`No duration data available for mode: ${mode}`);
                        return;
                    }

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
    const handleDirectionPress = async (origin, dest, mode, wantsClassroom, classroom) => {
        setLoading(true);
        setCurrentOrigin(origin);
        setCurrentDestination(dest);
        setWantsClassroom(wantsClassroom);
        SetClassroomNumber(classroom);

        await fetchDirections(origin, dest, mode, setTravelTimes, setIsDirectionsView, setLoading, setRoutes, setFastestRoute);

        setLoading(false);

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

            fetchRoutesData(formattedO, formattedD, modeSelected, setLoading, setRoutes, setFastestRoute);
        }
    }, [modeSelected, currentOrigin, currentDestination]);

    const [lastFetchedPlaceId, setLastFetchedPlaceId] = useState(null);

    const handleBuildingPress = async (building = null, lng = null, lat = null) => {
        setLoading(true);

        await fetchBuildingData(building , lng, lat, setLoading, lastFetchedPlaceId, setLastFetchedPlaceId, setBuildingDetails,setSelectedLocation);

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

    let isFetchingPlaces = false;

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

        await fetchPoI (place, setBuildingDetails);
    };


    return (
        <View style={styles.container}>
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle={isDark ? 'light-content' : 'dark-content'}
            />
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
                selectedCampus={selectedCampus}
            />

            {!isDirectionsView && (
                <View style={styles.searchContainer}>
                    {/* Back Button */}
                    <TouchableOpacity testID={'back-button'} style={styles.backButton} onPress={() => router.push('/Welcome')}>
                        <Ionicons name="chevron-back" size={28} color={theme.colors.dark}/>
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
                        onSelectCategory={ (category) => {
                            if (category) {
                                fetchPlacesOfInterest(category, currentLocation, isFetchingPlaces,setIsFetchingPlaces, setPlaces);
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
                        onCampusChange={setSelectedCampus}
                    />
                </View>
            )}
            {!isDirectionsView && (
                <LiveLocationButton onPress={setSelectedLocation}/>
            )}
            {!isDirectionsView && (
                <AppNavigationPannel/>
            )}
            {!isDirectionsView && (
                <ChatBotButton/>
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
                        classroomNum={classroomNumber}
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

const createStyles = (theme) => StyleSheet.create({
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
        // elevation: 5
    },
    mapButtonsContainer: {
        position: 'absolute',
        backgroundColor: theme.colors.main,
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
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
