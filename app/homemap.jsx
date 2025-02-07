import React, {useRef, useState} from "react";
import {
    ActivityIndicator,
    Animated,
    Image,
    Linking,
    PanResponder,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Map from "../components/Map";
import {theme} from "@/constants/theme";
import {Ionicons} from "@expo/vector-icons";
import MapButtons from "@/components/MapButtons";
import MainSearchBar from "@/components/MainSearchBar";

const GOOGLE_PLACES_API_KEY = "AIzaSyA2EELpYVG4YYVXKG3lOXkIcf-ppaIfa80";

const Homemap = () => {
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [buildingDetails, setBuildingDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mapCenter, setMapCenter] = useState([-73.5788, 45.4973]);

    const panelY = useRef(new Animated.Value(500)).current;
    const [selectedLocation, setSelectedLocation] = useState(null);

    const handleDirectionPress = () => {
        if (selectedBuilding) {
            const {textPosition} = selectedBuilding;
            const [longitude, latitude] = textPosition;
            const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
            Linking.openURL(url);
        }
    };

    const handleBuildingPress = async (building) => {
        setSelectedBuilding(building);

        if (building.textPosition) {
            const [lng, lat] = building.textPosition;
            const offsetLat = lat - 0.0014;
            setMapCenter([lng, offsetLat]);
        }

        setLoading(true);

        try {
            const {name, textPosition} = building;
            const [longitude, latitude] = textPosition;

            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
                    name
                )}&inputtype=textquery&fields=place_id&locationbias=circle:2000@${latitude},${longitude}&key=${GOOGLE_PLACES_API_KEY}`
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
            console.error("Error fetching building details:", error);
            setBuildingDetails(null);
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
            <View style={styles.searchOverlay}>
                <MainSearchBar onLocationSelect={setSelectedLocation} />
                <MapButtons onPress={setSelectedLocation} />
            </View>
            <Map onBuildingPress={handleBuildingPress} centerCoordinate={mapCenter} selectedLocation={selectedLocation} />

            {selectedBuilding && (
                <Animated.View
                    {...panResponder.panHandlers}
                    style={[styles.bottomPanel, {transform: [{translateY: panelY}]}]}
                >

                    <TouchableOpacity
                        onPress={handleClosePanel}
                        style={styles.closeButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="close-circle" size={32} color={theme.colors.dark}/>
                    </TouchableOpacity>


                    <View style={styles.dragBar}/>

                    {loading ? (
                        <ActivityIndicator size="large" color={theme.colors.primary}/>
                    ) : (
                        <>
                            <Text style={styles.buildingName}>
                                {selectedBuilding?.name || "Loading..."}
                            </Text>

                            {buildingDetails && (
                                <>
                                    {buildingDetails.photos && (
                                        <Image
                                            source={{
                                                uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${buildingDetails.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`,
                                            }}
                                            style={styles.buildingImage}
                                        />
                                    )}
                                    <Text style={styles.buildingDetails}>
                                        {buildingDetails.formatted_address}
                                    </Text>
                                </>
                            )}

                            <TouchableOpacity style={styles.directionButton} onPress={handleDirectionPress}>
                                <Ionicons name="navigate-circle" size={22} color={theme.colors.white}/>
                                <Text style={styles.directionButtonText}>Get Directions</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </Animated.View>
            )}
        </View>
    );
};

export default Homemap;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: StatusBar.currentHeight || 0,
    },

    bottomPanel: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        alignSelf: "center",
        backgroundColor: theme.colors.white,
        padding: 20,
        paddingBottom: 25,
        borderTopLeftRadius: theme.radius.xxl,
        borderTopRightRadius: theme.radius.xxl,
        shadowColor: theme.colors.dark,
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 8,
    },


    closeButton: {
        position: "absolute",
        top: -15,
        right: 2,
        backgroundColor: theme.colors.white,
        borderRadius: 20,
        padding: 5,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
        zIndex: 10,
    },

    dragBar: {
        width: 40,
        height: 5,
        backgroundColor: "#B0B0B0",
        borderRadius: 3,
        alignSelf: "center",
        marginBottom: 15,
        marginTop: -5,
        opacity: 0.6,
    },


    buildingName: {
        fontSize: 20,
        fontWeight: "bold",
        color: theme.colors.dark,
        marginBottom: 10,
        textAlign: "center",
    },

    buildingDetails: {
        fontSize: 14,
        color: theme.colors.textLight,
        textAlign: "center",
        marginBottom: 8,
    },

    buildingImage: {
        width: "100%",
        height: 160,
        borderRadius: 15,
        marginBottom: 12,
    },

    directionButton: {
        flexDirection: "row",
        marginTop: 12,
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
    },

    directionButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 8,
    },
    searchOverlay: {
        position: 'absolute',
        top: 80, // Adjust as needed
        left: 10,
        right: 10,
        zIndex: 10, // Ensure it's above the map
    },
});