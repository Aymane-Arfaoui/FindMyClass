import React, {useContext, useEffect, useMemo, useState} from 'react';
import MapboxGL from '@rnmapbox/maps';
import {StyleSheet, View} from 'react-native';
import {concordiaBuildingsGeoJSON} from "@/constants/concordiaBuildings";
import Config from 'react-native-config';
import {Ionicons} from '@expo/vector-icons';
import PropTypes from "prop-types";
import {ThemeContext} from '@/context/ThemeProvider';

const MAPBOX_ACCESS_TOKEN = Config.MAPBOX_ACCESS_TOKEN;

// Campus coordinates
const CAMPUS_COORDINATES = {
    SGW: [-73.5789, 45.4973], // Sir George Williams
    LOYOLA: [-73.6409, 45.4582] // Loyola
};

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
    places = [],
    onSelectedPOI,
    selectedCampus = 'SGW'
}) => {
    const { theme, isDark, colorBlindMode } = useContext(ThemeContext);
    const [styleLoaded, setStyleLoaded] = useState(false);
    const styles = useMemo(() => createStyles(theme), [theme]);

    // Get coordinates based on selected campus
    const safeCoordinates = useMemo(() => {
        if (Array.isArray(selectedLocation)) {
            return selectedLocation;
        }
        return CAMPUS_COORDINATES[selectedCampus] || CAMPUS_COORDINATES.SGW;
    }, [selectedLocation, selectedCampus]);

    // Initial camera position with 3D view
    useEffect(() => {
        if (cameraRef.current) {
            cameraRef.current.setCamera({
                centerCoordinate: safeCoordinates,
                zoomLevel: selectedCampus === 'SGW' ? 16 : 15.5,
                pitch: 35,
                heading: 0,
                animationDuration: 1000,
            });
        }
    }, [safeCoordinates, selectedCampus]);

    const mapStyleURL = useMemo(() => {
        if (colorBlindMode) {
            return isDark 
                ? 'mapbox://styles/mapbox/light-v11'  // Light theme for better contrast in dark mode
                : 'mapbox://styles/mapbox/streets-v12'; // Regular streets for normal mode
        }
        
        return isDark
            ? 'mapbox://styles/mapbox/dark-v11'  // Dark theme
            : 'mapbox://styles/mapbox/streets-v12';  // Regular Light theme
    }, [isDark, colorBlindMode]);

    useEffect(() => {
        setStyleLoaded(false);
    }, [mapStyleURL]);

    // Format user location for MapboxGL
    const formattedUserLocation = useMemo(() => {
        if (!userLocation) return null;
        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: Array.isArray(userLocation) ? userLocation : CAMPUS_COORDINATES.SGW
            }
        };
    }, [userLocation]);

    return (
        <View style={styles.container}>
            <MapboxGL.MapView
                key={mapStyleURL}
                style={styles.map}
                styleURL={mapStyleURL}
                rotateEnabled={true}
                attributionEnabled={false}
                logoEnabled={false}
                zoomEnabled={true}
                scrollEnabled={true}
                compassEnabled={true}
                pitchEnabled={true}
                onPress={onMapPress}
                onDidFinishLoadingStyle={() => setStyleLoaded(true)}
            >
                <MapboxGL.Camera
                    ref={cameraRef}
                    defaultSettings={{
                        centerCoordinate: safeCoordinates,
                        zoomLevel: selectedCampus === 'SGW' ? 16 : 15.5,
                        pitch: 35,
                        heading: 0
                    }}
                    animationDuration={1000}
                />

                {/* Traffic Layer */}
                {styleLoaded && (
                    <>
                        <MapboxGL.ShapeSource
                            id="traffic"
                            isClustered={false}
                            url="mapbox://mapbox.mapbox-traffic-v1"
                        >
                            <MapboxGL.LineLayer
                                id="traffic-layer"
                                sourceLayerId="traffic"
                                style={{
                                    lineColor: [
                                        'match',
                                        ['get', 'congestion'],
                                        'low', '#4CAF50',
                                        'moderate', '#FFA000',
                                        'heavy', '#FF5252',
                                        'severe', '#D32F2F',
                                        '#4CAF50'
                                    ],
                                    lineWidth: 3,
                                    lineOpacity: 0.8
                                }}
                            />
                        </MapboxGL.ShapeSource>

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
                            {/* Professional 3D building layer */}
                            <MapboxGL.FillExtrusionLayer
                                id="building-extrusion"
                                style={{
                                    fillExtrusionColor: [
                                        'case',
                                        ['boolean', ['feature-state', 'hover'], false],
                                        '#ff1a1a',
                                        '#e60000'
                                    ],
                                    fillExtrusionOpacity: 0.9,
                                    fillExtrusionHeight: [
                                        'case',
                                        ['has', 'height'],
                                        ['*', ['to-number', ['get', 'height'], 15], 0.6],
                                        15
                                    ],
                                    fillExtrusionBase: 0,
                                    fillExtrusionVerticalGradient: true
                                }}
                            />

                            {/* Building Labels */}
                            <MapboxGL.SymbolLayer
                                id="building-labels"
                                style={{
                                    textField: ['get', 'name'],
                                    textSize: 13,
                                    textColor: '#1a1a1a',
                                    textHaloColor: '#ffffff',
                                    textHaloWidth: 2,
                                    textHaloBlur: 1,
                                    textAnchor: 'center',
                                    textJustify: 'center',
                                    textAllowOverlap: false,
                                    symbolPlacement: 'point',
                                    textOffset: [0, 0],
                                    textTranslate: [0, -5],
                                    textRotationAlignment: 'viewport',
                                    textMaxWidth: 12
                                }}
                            />
                        </MapboxGL.ShapeSource>

                        {/* Enhanced light source */}
                        <MapboxGL.Light
                            style={{
                                position: [1.5, 90, 30],
                                color: '#ffffff',
                                intensity: 0.7
                            }}
                        />

                        {/* User Location with improved styling */}
                        {formattedUserLocation && (
                            <MapboxGL.ShapeSource id="user-location-source" shape={formattedUserLocation}>
                                <MapboxGL.CircleLayer
                                    id="user-location-layer"
                                    style={{
                                        circleRadius: 6,
                                        circleColor: '#e60000',
                                        circleStrokeWidth: 2,
                                        circleStrokeColor: '#ffffff',
                                        circlePitchAlignment: 'map'
                                    }}
                                />
                                <MapboxGL.CircleLayer
                                    id="user-location-halo"
                                    style={{
                                        circleRadius: 15,
                                        circleColor: '#e60000',
                                        circleOpacity: 0.2,
                                        circlePitchAlignment: 'map'
                                    }}
                                />
                            </MapboxGL.ShapeSource>
                        )}
                    </>
                )}

                {/* Places of Interest */}
                {places.map((place, index) => {
                    if (!place?.geometry?.coordinates || !Array.isArray(place.geometry.coordinates)) {
                        return null;
                    }

                    let iconName;
                    let iconColor;

                    if (place.category === "restaurant") {
                        iconName = "fast-food-outline";
                        iconColor = theme.colors.marker.restaurant;
                    } else if (place.category === "cafe") {
                        iconName = "cafe-outline";
                        iconColor = theme.colors.marker.cafe;
                    } else if (place.category === "atm") {
                        iconName = "card-outline";
                        iconColor = theme.colors.marker.atm;
                    } else {
                        iconName = "location";
                        iconColor = theme.colors.marker.default;
                    }

                    return (
                        <MapboxGL.PointAnnotation
                            key={`place-${index}`}
                            id={`place-${index}`}
                            coordinate={place.geometry.coordinates}
                            onSelected={() => onSelectedPOI(place)}
                        >
                            <View style={{ zIndex: 1000 }}>
                                <Ionicons name={iconName} size={24} color={iconColor} />
                            </View>
                        </MapboxGL.PointAnnotation>
                    );
                })}

                {/* Routes with enhanced styling */}
                {routes && routes.length > 0 && routes.map((route, index) => {
                    if (!route?.routeGeoJSON?.geometry?.coordinates) return null;
                    const isSelected = selectedRoute && selectedRoute === route;
                    
                    return (
                        <MapboxGL.ShapeSource
                            key={`route-${index}`}
                            id={`route-${index}`}
                            shape={route.routeGeoJSON}
                            onPress={() => onRoutePress(route)}
                        >
                            <MapboxGL.LineLayer
                                id={`route-line-${index}`}
                                style={{
                                    lineColor: isSelected ? '#e60000' : '#ff4d4d',
                                    lineWidth: isSelected ? 4 : 3,
                                    lineOpacity: isSelected ? 1 : 0.8,
                                    lineCap: 'round',
                                    lineJoin: 'round'
                                }}
                            />
                        </MapboxGL.ShapeSource>
                    );
                })}

                {/* Route Endpoint Marker */}
                {selectedRoute?.routeGeoJSON?.geometry?.coordinates?.length > 0 && (
                    <MapboxGL.PointAnnotation
                        id="selectedRouteEndpoint"
                        coordinate={selectedRoute.routeGeoJSON.geometry.coordinates[
                            selectedRoute.routeGeoJSON.geometry.coordinates.length - 1
                        ]}
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
    onSelectedPOI: PropTypes.func,
    selectedCampus: PropTypes.oneOf(['SGW', 'LOYOLA'])
};

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1
    },
    map: {
        flex: 1
    },
    userMarkerStyle: {
        circleRadius: 8,
        circleColor: theme.colors.userLocation,
        circleStrokeWidth: 2,
        circleStrokeColor: '#fff',
    },
    route: {
        lineColor: theme.colors.route,
        lineWidth: 3,
        lineOpacity: 0.8,
    },
    selectedRoute: {
        lineColor: theme.colors.selectedRoute,
        lineWidth: 4,
        lineOpacity: 1,
    },
    endpointMarker: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.colors.endpoint,
        borderWidth: 2,
        borderColor: '#fff',
    },
});

export default Map;

