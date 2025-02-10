import React, {useEffect, useRef, useState} from 'react';
import {Animated, PanResponder, StatusBar, StyleSheet, View} from 'react-native';
import Map from '../components/Map';
import {fetchRoutes} from '../services/routeService';
import {getUserLocation} from '../services/userService';
import BuildingDetailsPanel from "@/components/BuildingDetailsPanel";
import {theme} from "@/constants/theme";
import MapButtons from "@/components/MapButtons";
import MainSearchBar from "@/components/MainSearchBar";
import LiveLocationButton from '@/components/LiveLocationButton';


const Homemap = ({destination, selectedMode}) => {
    const GOOGLE_PLACES_API_KEY = "AIzaSyA2EELpYVG4YYVXKG3lOXkIcf-ppaIfa80";
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [buildingDetails, setBuildingDetails] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [routes, setRoutes] = useState([]);
    // const [userLocation, setUserLocation] = useState(null);
    const [fastestRoute, setFastestRoute] = useState(null);
    const [loading, setLoading] = useState(true);
    const panelY = useRef(new Animated.Value(500)).current;
    const [currentLocation, setCurrentLocation] = useState(null);

    useEffect(() => {
        const initialize = async () => {
            try {
                const location = await getUserLocation();
                setCurrentLocation(location);

                if (destination) {
                    await fetchRoutesData(location, destination, selectedMode);
                }
            } catch (error) {
                // console.error('Error initializing location/routes:', error);
            } finally {
                setLoading(false);
            }
        };
        initialize();

        const interval = setInterval(async () => {
            const location = await getUserLocation();
            setCurrentLocation(location);
        }, 5000);

        return () => clearInterval(interval);
    }, [destination, selectedMode]);

    const fetchRoutesData = async (origin, destination, mode) => {
        setLoading(true);
        try {
            // console.log(`Fetching ${mode} routes from ${origin.lat},${origin.lng} to ${destination.lat},${destination.lng}`);

            let routes = await fetchRoutes(origin, destination, mode);

            if (Array.isArray(routes)) {
                routes.sort((a, b) => parseInt(a.duration) - parseInt(b.duration));
                setRoutes(routes);
                setFastestRoute(routes.length > 0 ? routes[0] : null);
            }
        } catch (error) {
            // console.error(`Error fetching ${mode} routes:`, error);
        } finally {
            setLoading(false);
        }
    };
    const handleBuildingPress = async (building = null, lng = null, lat = null) => {
        setLoading(true);
        if (building) {
            setSelectedBuilding(building);

            const [buildingLng, buildingLat] = building.textPosition || [lng, lat];
            const offsetLat = (buildingLat || lat) - 0.0010;
            setSelectedLocation([buildingLng || lng, offsetLat]);

            try {
                const {name} = building;

                const response = await fetch(
                    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
                        name
                    )}&inputtype=textquery&fields=place_id&locationbias=circle:2000@${buildingLat || lat},${buildingLng || lng}&key=${GOOGLE_PLACES_API_KEY}`
                );

                const data = await response.json();
                if (data.candidates.length > 0) {
                    const placeId = data.candidates[0].place_id;

                    const detailsResponse = await fetch(
                        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_address,opening_hours,photos&key=${GOOGLE_PLACES_API_KEY}`
                    );

                    const detailsData = await detailsResponse.json();
                    setBuildingDetails(detailsData.result);
                } else {
                    setBuildingDetails(null);
                }
            } catch (error) {
                setBuildingDetails(null);
            }
        } else if (lng !== null && lat !== null) {
            const offsetLat = lat - 0.0010;
            setSelectedLocation([lng, offsetLat]);

            try {
                const response = await fetch(
                    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_PLACES_API_KEY}`
                );

                const data = await response.json();
                if (data.results.length > 0) {
                    const placeDetails = data.results[0];
                    setBuildingDetails(placeDetails);
                    setSelectedBuilding({
                        name: placeDetails.formatted_address,
                        textPosition: [lng, lat],
                    });
                } else {
                    setBuildingDetails(null);
                    setSelectedBuilding(null);
                }
            } catch (error) {
                setBuildingDetails(null);
            }
        }

        setLoading(false);

        Animated.timing(panelY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };


    const handleClosePanel = () => {
        Animated.timing(panelY, {
            toValue: 500,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setSelectedBuilding(null);
            setBuildingDetails(null);
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
                destination={destination}
                routes={routes}
                selectedRoute={fastestRoute}
                onMapPress={handleClosePanel}
            />


            {/*routes={routes} selectedRoute={fastestRoute}/>*/}
            {/*<View style={styles.searchOverlay}>*/}
            {/*    <View> <MainSearchBar onLocationSelect={setSelectedLocation} /> </View>*/}
            {/*   <View> <MapButtons*/}
            {/*       onPress={(location) => {*/}
            {/*           setSelectedLocation(location);*/}
            {/*           handleClosePanel();*/}
            {/*       }}*/}
            {/*   /></View>*/}
            {/*</View>*/}


            <View style={styles.searchOverlay}>
                <MainSearchBar
                    onLocationSelect={setSelectedLocation}
                    onBuildingPress={handleBuildingPress}
                />
            </View>
            <View style={styles.mapButtonsContainer}>
                <MapButtons
                    onPress={(location) => {
                        setSelectedLocation(location);
                        handleClosePanel();
                    }}
                />
            </View>
            <LiveLocationButton onPress={setSelectedLocation}/>


            {selectedBuilding && (
                <BuildingDetailsPanel
                    selectedBuilding={selectedBuilding}
                    buildingDetails={buildingDetails}
                    loading={loading}
                    panelY={panelY}
                    panHandlers={panResponder.panHandlers}
                    onClose={handleClosePanel}
                    GOOGLE_PLACES_API_KEY={GOOGLE_PLACES_API_KEY}
                />
            )}

            {/*<View style={styles.infoBox}>*/}
            {/*    <Text style={styles.header}>Available Routes:</Text>*/}
            {/*    {loading ? (*/}
            {/*        <ActivityIndicator size="large" color="#0000ff"/>*/}
            {/*    ) : (*/}
            {/*        <ScrollView>*/}
            {/*            {routes.length > 0 ? (*/}
            {/*                routes.map((route, index) => (*/}
            {/*                    <View key={index} style={styles.routeCard}>*/}
            {/*                        <Text style={styles.routeMode}>{route.mode.toUpperCase()}</Text>*/}
            {/*                        <Text>Duration: {route.duration}</Text>*/}
            {/*                        <Text>Distance: {route.distance}</Text>*/}
            {/*                        {route.departure && <Text>Next Shuttle: {route.departure}</Text>}*/}
            {/*                    </View>*/}
            {/*                ))*/}
            {/*            ) : (*/}
            {/*                <Text style={styles.noRoutes}>No routes available.</Text>*/}
            {/*            )}*/}
            {/*        </ScrollView>*/}
            {/*    )}*/}
            {/*</View>*/}
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

export default Homemap;
