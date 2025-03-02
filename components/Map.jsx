import React, {useEffect, useRef, useState} from 'react';
import MapboxGL from '@rnmapbox/maps';
import {StyleSheet, View} from 'react-native';
import {theme} from "@/constants/theme";
import {getUserLocation} from "@/services/userService";
import {concordiaBuildingsGeoJSON} from "@/constants/concordiaBuildings";
import Config from 'react-native-config';
import { Ionicons } from '@expo/vector-icons';


const MAPBOX_ACCESS_TOKEN=Config.MAPBOX_ACCESS_TOKEN;
MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

const Map = ({onBuildingPress, selectedLocation, userLocation,centerCoordinate, routes, selectedRoute, onMapPress,cameraRef, onRoutePress, places, onSelectedPOI }) => {

    useEffect(() => {

        if (selectedLocation && cameraRef.current) {
            cameraRef.current.flyTo(selectedLocation, 800);
        }
    }, []);

    // console.log("Rendering map with selected location:", selectedLocation);
    // console.log("Rendering map with user location:", userLocation);



    // console.log("Rendering map with selected location:", selectedLocation);

    return (
        <View style={styles.container}>
            <MapboxGL.MapView
                style={styles.map}
                styleURL="mapbox://styles/rwz/cm6odl6aq01bn01qm3tc9eqif"
                rotateEnabled={false}
                attributionEnabled={false}
                logoEnabled={false}
                zoomEnabled={true}
                scrollEnabled={true}
                compassEnabled={false}
                onPress={() => onMapPress()}
            >

                <MapboxGL.Camera
                    ref={cameraRef}
                    zoomLevel={16}
                    centerCoordinate={centerCoordinate || selectedLocation}
                    animationMode="flyTo"
                    animationDuration={500}
                />

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

               
                {userLocation && (
                    <MapboxGL.ShapeSource
                        id="user-location-source"
                        shape={userLocation}
                    >
                        <MapboxGL.CircleLayer
                            id="user-location-layer"
                            style={styles.userMarkerStyle}
                        />
                    </MapboxGL.ShapeSource>
                )}

                {/* Places of Interest */}
                {places.map((place, index) => {
                    let iconName;
                    let iconColor; // Default color (Tomato Red)

                    // Assign icons based on category
                    if (place.category === "restaurant") {
                        iconName = "restaurant";
                        iconColor = "#ff8c00"; // Orange
                    } else if (place.category === "cafe") {
                        iconName = "cafe";
                        iconColor = "#8b4513"; // SaddleBrown
                    } else if (place.category === "atm") {
                        iconName = "cash";
                        iconColor = "#228b22"; // ForestGreen
                    } else {
                        iconName = "location"; // Default marker
                        iconColor = "#4682b4"; // SteelBlue
                    }

                    return (
                        <MapboxGL.PointAnnotation key={`place-${index}`} id={`place-${index}`} coordinate={place.geometry.coordinates} onSelected={() => onSelectedPOI(place)}>
                            <Ionicons name={iconName} size={24} color={iconColor} />

                        </MapboxGL.PointAnnotation>
                    );
                })}

                 {/* Render the routes if available */}

                {routes && routes.length > 0 && routes.map((route, index) => {
          // Use strict equality or compare based on an id property if available.
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
              <View style={styles.endpointMarker} />

            </MapboxGL.PointAnnotation>
         )}

            </MapboxGL.MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {flex: 1},
    map: {flex: 1},

    buildingFill: {
        fillColor: ["get", "color"],
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
        width: 24, // Size of the marker
        height: 24,
        borderRadius: 12, // Half of width/height for a perfect circle
        backgroundColor: 'red', // Fill color of the marker
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2, // Border thickness
        borderColor: 'white', // Border color (optional)
      },
    
    // Inner marker (smaller circle inside for a layered effect)
    innerMarker: {
        width: 12, // Smaller size for inner circle
        height: 12,
        borderRadius: 6,
        backgroundColor: 'white', // Inner fill color
    },

    poiMarker: {
        width: 15,
        height: 15,
        backgroundColor: "purple",
        borderRadius: 7.5,
    },


});

export default Map;
