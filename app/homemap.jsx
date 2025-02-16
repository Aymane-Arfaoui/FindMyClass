import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Animated, PanResponder, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import Map from '../components/Map';
import {fetchRoutes} from '../services/routeService';
import {getUserLocation} from '../services/userService';
import BuildingDetailsPanel from "@/components/BuildingDetailsPanel";
import {theme} from "@/constants/theme";
import MapButtons from "@/components/MapButtons";
import MainSearchBar from "@/components/MainSearchBar";
import LiveLocationButton from '@/components/LiveLocationButton';
import SearchBars from '@/components/SearchBars';
import BottomPanel from "@/components/BottomPanel";
import { GOOGLE_PLACES_API_KEY } from '@env';
import { type } from '@testing-library/react-native/build/user-event/type';



export default function Homemap(){

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

        try {
            const originCoords = origin.geometry?.coordinates;  // [lng, lat]
            const destCoords = dest.geometry?.coordinates;      // [lng, lat]

            if (!originCoords || !destCoords) {
                setLoading(false);
                return;
            }
            const formattedOrigin = `${originCoords[1]},${originCoords[0]}`;
            const formattedDestination = `${destCoords[1]},${destCoords[0]}`;
            await fetchRoutesData(formattedOrigin, formattedDestination, mode);

            setIsDirectionsView(true);
        } catch (error) {

        } finally {
            setLoading(false);
        }
    };


    const handleBuildingPress = async (building = null, lng = null, lat = null) => {
        setLoading(true);
        // console.log("Building: ", building);
        if (building) {
            // setSelectedBuilding(building);

            const [buildingLng, buildingLat] = building.textPosition || [lng, lat];
            const offsetLat = (buildingLat || lat) - 0.0010;
            setSelectedLocation(
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [buildingLng || lng, buildingLat || lat],
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

            // setSelectedLocation({
            //     type: "Feature",
            //     geometry: {
            //         type: "Point",
            //         coordinates: [lng, offsetLat],
            //     },
            // });

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
            // console.log("Building:", building);
            // console.log("Selected Location:", selectedLocation);
            // console.log("User Location:", currentLocation);
            // console.log("Routes:", routes);
            // console.log("lng:", lng);
            // console.log("lat:", lat);
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
            />

            {!isDirectionsView && (
                <View style={styles.searchOverlay}>
                    <MainSearchBar
                        onLocationSelect={setSelectedLocation}
                        onBuildingPress={handleBuildingPress}
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
                    />

                    <BottomPanel
                        transportMode={modeSelected}
                        routeDetails={routeDetails}
                    />
                </>
            )}
            {isDirectionsView && (
                <View style={styles.infoBox}>
                    <Text style={styles.header}>Available Routes:</Text>
                    {loading ? (
                        <ActivityIndicator size="large" color="#0000ff"/>
                    ) : (
                        <ScrollView>
                            {routes?.length > 0 ? (
                                routes.map((route, index) => (
                                    <View key={index} style={styles.routeCard}>
                                        <Text style={styles.routeMode}>{route.mode.toUpperCase()}</Text>
                                        <Text>Duration: {route.duration}</Text>
                                        <Text>Distance: {route.distance}</Text>
                                        {route.departure && <Text>Next Shuttle: {route.departure}</Text>}
                                    </View>
                                ))
                            ) : (
                                <View>
                                    <Text style={styles.noRoutes}>No routes available, or routes are loading. Please wait, or select a transport mode to try again.</Text>

                                    {/FOR TESTING ONLY:/}
                                    <Text>{routes.length}</Text>
                                    <Text>{modeSelected}</Text>
                                    <Text>{userLocation.lat.toString() + ',' + userLocation.lng.toString()}</Text>
                                    <Text>{selectedLocation[1].toString() +','+ selectedLocation[0].toString()}</Text>
                                </View>
                            )}
                        </ScrollView>
                    )}
                </View>
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
    searchOverlay: {
        position: 'absolute',
        top: 80,
        left: 10,
        right: 10,
        zIndex: 10,
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
