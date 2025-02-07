import React, {useRef, useState} from "react";
import {Animated, Linking, PanResponder, StatusBar, StyleSheet, View,} from "react-native";
import Map from "../components/Map";
import {theme} from "@/constants/theme";
import MapButtons from "@/components/MapButtons";
import BuildingDetailsPanel from "@/components/BuildingDetailsPanel";


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
                {/*<MainSearchBar onLocationSelect={setSelectedLocation} />*/}
                <MapButtons onPress={setSelectedLocation}/>
            </View>
            <Map onBuildingPress={handleBuildingPress} centerCoordinate={mapCenter}
                 selectedLocation={selectedLocation}/>

            {selectedBuilding && (
                <BuildingDetailsPanel
                    selectedBuilding={selectedBuilding}
                    buildingDetails={buildingDetails}
                    loading={loading}
                    panelY={panelY}
                    panHandlers={panResponder.panHandlers}
                    onClose={handleClosePanel}
                    onDirectionPress={handleDirectionPress}
                    GOOGLE_PLACES_API_KEY={GOOGLE_PLACES_API_KEY}
                />
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
    searchOverlay: {
        position: 'absolute',
        top: 80,
        left: 10,
        right: 10,
        zIndex: 10,
    },
});