import React, {useContext, useEffect, useMemo, useState} from 'react';
import MapboxGL from '@rnmapbox/maps';
import {StyleSheet, View} from 'react-native';
import {concordiaBuildingsGeoJSON} from "@/constants/concordiaBuildings";
import Config from 'react-native-config';
import {Ionicons} from '@expo/vector-icons';
import PropTypes from "prop-types";
import {ThemeContext} from '@/context/ThemeProvider';

const MAPBOX_ACCESS_TOKEN = Config.MAPBOX_ACCESS_TOKEN;

MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);


const Map = ({
                 onBuildingPress,
                 selectedLocation,
                 userLocation,
                 centerCoordinate,
                 routes,
                 selectedRoute,
                 onMapPress,
                 cameraRef,
                 onRoutePress,
                 places,
                 onSelectedPOI
             }) => {

    const { theme, isDark, colorBlindMode } = useContext(ThemeContext);
    const [styleLoaded, setStyleLoaded] = useState(false);
    const styles = useMemo(() => createStyles(theme), [theme]);

    useEffect(() => {

        if (selectedLocation && cameraRef.current) {
            cameraRef.current.flyTo(selectedLocation, 800);
        }
    }, []);
    const mapStyleURL = useMemo(() => {
        if (colorBlindMode && isDark) {
            return 'mapbox://styles/rwz/cm8nzp5wf005l01sddncm7d4m'; // Color Blind + Dark
        } else if (colorBlindMode && !isDark) {
            return 'mapbox://styles/rwz/cm8nzeycl005c01qr2k6rds82'; // Color Blind + Light
        } else if (isDark) {
            return 'mapbox://styles/rwz/cm8awc1o4007i01qrekqq35gd'; // Regular Dark
        } else {
            return 'mapbox://styles/rwz/cm6odl6aq01bn01qm3tc9eqif'; // Regular Light
        }
    }, [isDark, colorBlindMode]);
    useEffect(() => {
        setStyleLoaded(false);
    }, [mapStyleURL]);

    return (
        <View style={styles.container}>
            <MapboxGL.MapView
                key={mapStyleURL}
                style={styles.map}
                styleURL={mapStyleURL}
                rotateEnabled={false}
                attributionEnabled={false}
                logoEnabled={false}
                zoomEnabled={true}
                scrollEnabled={true}
                compassEnabled={false}
                onPress={() => onMapPress()}
                onDidFinishLoadingStyle={() => setStyleLoaded(true)}
            >

                <MapboxGL.Camera
                    ref={cameraRef}
                    zoomLevel={16}
                    centerCoordinate={centerCoordinate || selectedLocation}
                    animationMode="flyTo"
                    animationDuration={500}
                />

                {styleLoaded && (
                    <>
                        <MapboxGL.ShapeSource
                            id="concordia-buildings"
                            shape={concordiaBuildingsGeoJSON}
                            onPress={(event) => {
                                const feature = event.features && event.features[0];
                                if (feature && feature.properties) {
                                    onBuildingPress(feature.properties);
                                }
                            }}
                        >
                            <MapboxGL.FillLayer id="building-fill" style={styles.buildingFill}/>
                            <MapboxGL.SymbolLayer id="building-labels" style={styles.buildingLabel}/>
                        </MapboxGL.ShapeSource>

                        {styleLoaded && userLocation && (
                            <MapboxGL.ShapeSource id="user-location-source" shape={userLocation}>
                                <MapboxGL.CircleLayer id="user-location-layer" style={styles.userMarkerStyle} />
                            </MapboxGL.ShapeSource>
                        )}

                        {/* You can include routes, POIs, endpoint, etc. here too */}
                    </>
                )}

                {/* Places of Interest */}
                {places.map((place, index) => {
                    let iconName;
                    let iconColor;

                    if (place.category === "restaurant") {
                        iconName = "fast-food-outline";
                        iconColor = theme.colors.marker.restaurant;
                    } else if (place.category === "cafe") {
                        iconName = "cafe-outline";
                        iconColor = theme.colors.marker.cafe;
                    } else if (place.category === "atm") {
                        iconName = "card-outline"; // Better representation of ATM
                        iconColor = theme.colors.marker.atm;
                    } else {
                        iconName = "location";
                        iconColor = theme.colors.marker.default;
                    }

                    return (
                        <MapboxGL.PointAnnotation key={`place-${index}`} id={`place-${index}`}
                                                  coordinate={place.geometry.coordinates}
                                                  onSelected={() => onSelectedPOI(place)}>
                            <View style={{ zIndex: 1000 }}>
                                <Ionicons name={iconName} size={24} color={iconColor} />
                            </View>
                        </MapboxGL.PointAnnotation>
                    );
                })}

                {/* Render the routes if available */}

                {routes && routes.length > 0 && routes.map((route, index) => {

                    const isSelected = selectedRoute && selectedRoute === route;
                    if (!(route.routeGeoJSON)) return null;
                    return (
                        <MapboxGL.ShapeSource key={`route-${index}`} id={`route-${index}`} shape={route.routeGeoJSON}
                                              onPress={() => onRoutePress(route)} // onPress to update selected route
                        >
                            <MapboxGL.LineLayer
                                id={`route-line-${index}`}
                                style={isSelected ? styles.selectedRoute : styles.route}
                            />
                        </MapboxGL.ShapeSource>
                    );
                })}

                {/* Render a marker at the endpoint of the selected route */}
                {selectedRoute &&
                    selectedRoute.routeGeoJSON &&
                    selectedRoute.routeGeoJSON.geometry &&
                    selectedRoute.routeGeoJSON.geometry.coordinates &&
                    selectedRoute.routeGeoJSON.geometry.coordinates.length > 0 && (
                        <MapboxGL.PointAnnotation
                            id="selectedRouteEndpoint"
                            coordinate={
                                selectedRoute.routeGeoJSON.geometry.coordinates[
                                selectedRoute.routeGeoJSON.geometry.coordinates.length - 1
                                    ]
                            }
                        >
                            <View style={styles.endpointMarker}/>

                        </MapboxGL.PointAnnotation>
                    )}

            </MapboxGL.MapView>
        </View>
    );
};
Map.propTypes = {
    onBuildingPress: PropTypes.func,
    selectedLocation: PropTypes.any,
    userLocation: PropTypes.any,
    centerCoordinate: PropTypes.any,
    routes: PropTypes.array,
    selectedRoute: PropTypes.object,
    onMapPress: PropTypes.func,
    cameraRef: PropTypes.object,
    onRoutePress: PropTypes.func,
    places: PropTypes.array,
    onSelectedPOI: PropTypes.func
}
const createStyles = (theme) => StyleSheet.create({
    container: {flex: 1},
    map: {flex: 1},

    buildingFill: {
        fillColor: theme.colors.primary,
        fillOpacity: 0.8,
    },
    buildingLabel: {
        textField: ["get", "name"],
        textSize: 14,
        textColor: theme.colors.dark,
        textHaloColor: theme.colors.secondary,
        textHaloWidth: 1,
        textFont: ["Open Sans Bold"],
        textJustify: "center",
        textAnchor: "top",
        textOffset: [0, 1],
    },

    userMarkerStyle: {
        circleRadius: 8,
        circleColor: theme.colors.blueDark,
        circleStrokeWidth: 2,
        circleStrokeColor: 'white',
        circleOpacity: 1,
    },
    route: {
        lineColor: 'gray',
        lineWidth: 2,
        lineOpacity: 0.6,
    },

    selectedRoute: {
        lineColor: 'blue',
        lineWidth: 4,
        lineOpacity: 0.8,
    },

    endpointMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },

    // Inner marker (smaller circle inside for a layered effect)
    innerMarker: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'white',
    },

    poiMarker: {
        width: 15,
        height: 15,
        backgroundColor: "purple",
        borderRadius: 7.5,
    },


});

export default Map;

