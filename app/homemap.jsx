import React, {useEffect, useRef, useState} from 'react';
import {Animated, PanResponder, StatusBar, StyleSheet, View} from 'react-native';
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
import PlaceFilterButtons from "@/components/PlaceFilterButtons";

const GOOGLE_PLACES_API_KEY = Config.GOOGLE_PLACES_API_KEY;

export default function Homemap() {

    const [buildingDetails, setBuildingDetails] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [routes, setRoutes] = useState([]);
    const [fastestRoute, setFastestRoute] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [centerCoordinate, setCenterCoordinate] = useState([-73.5789, 45.4960]);
    const cameraRef = useRef(null);
    const [isDirectionsView, setIsDirectionsView] = useState(false);
    const [routeDetails, setRouteDetails] = useState(null);
    const [modeSelected, setModeSelected] = useState('walking');
    const panelY = useRef(new Animated.Value(500)).current;
    const [currentOrigin, setCurrentOrigin] = useState(null);
    const [currentDestination, setCurrentDestination] = useState(null);
    const [places, setPlaces] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

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
        const modes = ['driving', 'transit', 'walking', 'bicycling'];
        const updatedTravelTimes = {
            driving: 'N/A',
            transit: 'N/A',
            walking: 'N/A',
            bicycling: 'N/A',
        };

        await Promise.all(
            modes.map(async (mode) => {
                const url = `https://maps.googleapis.com/maps/api/directions/json
        ?origin=${encodeURIComponent(originStr)}
        &destination=${encodeURIComponent(destinationStr)}
        &mode=${mode}
        &alternatives=true
        &key=${GOOGLE_PLACES_API_KEY}`
                    .replace(/\s+/g, '');

                try {
                    const resp = await fetch(url);
                    const data = await resp.json();
                    if (data.routes && data.routes.length > 0) {
                        const bestRoute = data.routes.reduce((shortest, cur) =>
                            cur.legs[0].duration.value < shortest.legs[0].duration.value
                                ? cur
                                : shortest
                        );
                        const durSec = bestRoute.legs[0].duration.value;
                        const hours = Math.floor(durSec / 3600);
                        const minutes = Math.ceil((durSec % 3600) / 60);

                        let label = '';
                        if (hours > 0) {
                            label = `${hours}h ${minutes} min`;
                        } else {
                            label = `${minutes} min`;
                        }

                        updatedTravelTimes[mode] = label;
                    }
                } catch (err) {
                    console.error(`Error fetching ${mode}`, err);
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

                setRouteDetails({
                    distance: routes[0].distance,
                    duration: routes[0].duration
                });

            } else {
                setRoutes([]);
                setFastestRoute(null);
                setRouteDetails(null);
            }
        } catch (error) {
            setRoutes([]);
            setFastestRoute(null);
            setRouteDetails(null);
        } finally {
            setLoading(false);
        }
    };
    const handleDirectionPress = async (origin, dest, mode) => {
        setLoading(true);
        setCurrentOrigin(origin);
        setCurrentDestination(dest);

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
    useEffect(() => {
        if (isDirectionsView && currentOrigin && currentDestination) {
            const originCoords = currentOrigin.geometry?.coordinates; // [lng, lat]
            const destCoords = currentDestination.geometry?.coordinates; // [lng, lat]
            const formattedO = `${originCoords[1]},${originCoords[0]}`;
            const formattedD = `${destCoords[1]},${destCoords[0]}`;

            fetchRoutesData(formattedO, formattedD, modeSelected);
        }
    }, [modeSelected, currentOrigin, currentDestination]);

    const handleBuildingPress = async (building = null, lng = null, lat = null) => {
        setLoading(true);
        if (building) {
            const [buildingLng, buildingLat] = building.textPosition || [lng, lat];
            const offsetLat = (buildingLat || lat) - 0.0010;
            setSelectedLocation(
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [buildingLng || lng, offsetLat],
                    },
                    name: building.name || "Unnamed Building",
                }
            );
            const {name} = building;


            fetch(
                `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
                    name
                )}&inputtype=textquery&fields=place_id&locationbias=circle:2000@${buildingLat || lat},${buildingLng || lng}&key=${GOOGLE_PLACES_API_KEY}`
            )
                .then((response) => response.json())
                .then((data) => {
                    if (data.candidates.length > 0) {
                        const placeId = data.candidates[0].place_id;

                        fetch(
                            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_address,opening_hours,photos&key=${GOOGLE_PLACES_API_KEY}`
                        ).then((detailsResponse) => detailsResponse.json()).then((detailsData) => {
                            if (detailsData.result) {
                                setBuildingDetails(detailsData.result);
                            } else {
                                setBuildingDetails(null);
                            }
                        }).catch((error) => {
                            console.error("Error fetching building details:", error);
                            setBuildingDetails(null);
                        });

                    } else {
                        setBuildingDetails(null);
                    }
                }).catch((error) => {
                console.error("Error fetching building details:", error);
                setBuildingDetails(null);
            });

        } else if (lng !== null && lat !== null) {
            const offsetLat = lat - 0.0010;
            fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_PLACES_API_KEY}`)
                .then((response) => response.json())
                .then((data) => {
                    if (data.results.length > 0) {
                        const placeDetails = data.results[0];
                        setBuildingDetails(placeDetails);
                        setSelectedLocation({
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [lng, lat],
                            },
                        });
                    } else {
                        setBuildingDetails(null);
                        setSelectedLocation(null);
                        setRoutes([]);
                        setFastestRoute(null);
                    }
                }).catch((error) => {
                console.error("Error fetching building details:", error);
                setBuildingDetails(null);
            });
        }


        Animated.timing(panelY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
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
            setRoutes([]);
            setFastestRoute(null);
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

    const fetchPlacesOfInterest = async (category) => {
        if (!currentLocation) return;

        setPlaces([]); // Reset places list

        const { coordinates } = currentLocation.geometry;
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json
    ?location=${coordinates[1]},${coordinates[0]}
    &radius=1000
    &type=${category}
    &key=${GOOGLE_PLACES_API_KEY}`.replace(/\s+/g, '');

        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.results) {
                const formattedPlaces = data.results.map((place) => ({
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [
                            place.geometry.location.lng,
                            place.geometry.location.lat,
                        ],
                    },
                    name: place.name,
                    place_id: place.place_id || null,  // ✅ Ensure place_id is included
                    category: category,
                }));
                setPlaces(formattedPlaces);
            }
        } catch (error) {
            console.error("Error fetching places of interest:", error);
        }
    };

    const handlePOIPress = async (place) => {

        setSelectedLocation(place);

        Animated.timing(panelY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();

        try {
            const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,rating,formatted_address,photos&key=${GOOGLE_PLACES_API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.result) {
                setBuildingDetails(data.result);
            } else {
                console.warn("No details found for this place.");
            }
        } catch (error) {
            console.error("Error fetching POI details:", error);
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
                places={places}
                onSelectedPOI={handlePOIPress}
            />

            {!isDirectionsView && (
                <View style={styles.searchOverlay}>
                    <MainSearchBar
                        onLocationSelect={setSelectedLocation}
                        onBuildingPress={handleBuildingPress}
                    />
                </View>
            )}

            {/* Place Filter Buttons */}
            {!isDirectionsView && (
                <View style={styles.filterButtonsContainer}>
                    <PlaceFilterButtons
                        onSelectCategory={(category) => {
                            setSelectedCategory(category);
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
                        destination={buildingDetails?.formatted_address}
                        onBackPress={() => setIsDirectionsView(false)}
                        modeSelected={modeSelected}
                        setModeSelected={setModeSelected}
                        travelTimes={travelTimes}
                    />
                    <BottomPanel
                        transportMode={modeSelected}
                        routeDetails={routeDetails}
                        routes={routes}
                    />
                </>
            )}

            {/*{isDirectionsView && (*/}
            {/*    <View style={styles.infoBox}>*/}
            {/*        <Text style={styles.header}>Available Routes:</Text>*/}
            {/*        {loading ? (*/}
            {/*            <ActivityIndicator size="large" color="#0000ff"/>*/}
            {/*        ) : (*/}
            {/*            <ScrollView>*/}
            {/*                {routes?.length > 0 ? (*/}
            {/*                    routes.map((route, index) => (*/}
            {/*                        <View key={index} style={styles.routeCard}>*/}
            {/*                            <Text style={styles.routeMode}>{route.mode.toUpperCase()}</Text>*/}
            {/*                            <Text>Duration: {route.duration}</Text>*/}
            {/*                            <Text>Distance: {route.distance}</Text>*/}
            {/*                            {route.departure && <Text>Next Shuttle: {route.departure}</Text>}*/}
            {/*                        </View>*/}
            {/*                    ))*/}
            {/*                ) : (*/}
            {/*                    <View>*/}
            {/*                        <Text style={styles.noRoutes}>No routes available, or routes are loading. Please wait, or select a transport mode to try again.</Text>*/}

            {/*                        {/FOR TESTING ONLY:/}*/}
            {/*                        <Text>{routes.length}</Text>*/}
            {/*                        <Text>{modeSelected}</Text>*/}
            {/*                        <Text>{userLocation.lat.toString() + ',' + userLocation.lng.toString()}</Text>*/}
            {/*                        <Text>{selectedLocation[1].toString() +','+ selectedLocation[0].toString()}</Text>*/}
            {/*                    </View>*/}
            {/*                )}*/}
            {/*            </ScrollView>*/}
            {/*        )}*/}
            {/*    </View>*/}
            {/*)}*/}


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
    searchOverlay: {
        position: 'absolute',
        top: 80,
        left: 10,
        right: 10,
        zIndex: 10,
    },
    filterButtonsContainer: {
        position: "absolute",
        top: 140, // Ensure it's below the search bar
        left: 10,
        right: 10,
        zIndex: 10,
        flexDirection: "row",
        justifyContent: "center",
        paddingVertical: 8,
        borderRadius: 10,
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
        bottom: 820,
        left: 10,
        right: 10,
        zIndex: 5,
        alignItems: 'center',
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
