import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import Map from '../components/Map';
import { fetchRoutes } from '../services/routeService';
import { getUserLocation } from '../services/userService';

const Homemap = ({ destination, selectedMode }) => {
    const [routes, setRoutes] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [fastestRoute, setFastestRoute] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initialize = async () => {
            try {
                const location = await getUserLocation();
                if (!destination) throw new Error("Destination not provided");

                setUserLocation(location);
                await fetchRoutesData(location, destination, selectedMode);
            } catch (error) {
                console.error("Error initializing location/routes:", error);
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, [destination, selectedMode]);

    const fetchRoutesData = async (origin, destination, mode) => {
        setLoading(true);
        try {
            console.log(`Fetching ${mode} routes from ${origin.lat},${origin.lng} to ${destination.lat},${destination.lng}`);

            let routes = await fetchRoutes(origin, destination, mode);

            if (Array.isArray(routes)) {
                routes.sort((a, b) => parseInt(a.duration) - parseInt(b.duration));
                setRoutes(routes);
                setFastestRoute(routes.length > 0 ? routes[0] : null);
            }
        } catch (error) {
            console.error(`Error fetching ${mode} routes:`, error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
            <Map userLocation={userLocation} destination={destination} routes={routes} selectedRoute={fastestRoute} />

            <View style={styles.infoBox}>
                <Text style={styles.header}>Available Routes:</Text>
                {loading ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                    <ScrollView>
                        {routes.length > 0 ? (
                            routes.map((route, index) => (
                                <View key={index} style={styles.routeCard}>
                                    <Text style={styles.routeMode}>{route.mode.toUpperCase()}</Text>
                                    <Text>Duration: {route.duration}</Text>
                                    <Text>Distance: {route.distance}</Text>
                                    {route.departure && <Text>Next Shuttle: {route.departure}</Text>}
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noRoutes}>No routes available.</Text>
                        )}
                    </ScrollView>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
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
    header: { fontSize: 18, fontWeight: "bold" },
    routeCard: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
    routeMode: { fontSize: 16, fontWeight: "bold" },
    noRoutes: { textAlign: "center", color: "gray", marginTop: 10 }
});

export default Homemap;