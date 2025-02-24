import React, {useEffect, useRef, useState} from 'react';
import MapboxGL from '@rnmapbox/maps';
import {StyleSheet, View} from 'react-native';
import {theme} from "@/constants/theme";
import {getUserLocation} from "@/services/userService";
import {concordiaBuildingsGeoJSON} from "@/constants/concordiaBuildings";
import Config from 'react-native-config';
const MAPBOX_ACCESS_TOKEN='sk.eyJ1Ijoicnd6IiwiYSI6ImNtNm9peDZhdzE4NmQya3E0azV4dmYxenMifQ.5SH51Urj6KLeo-SHYbRTPw'
MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

const Map = ({onBuildingPress, selectedLocation, userLocation,centerCoordinate, routes, selectedRoute, onMapPress,cameraRef}) => {

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

                 {/* Render the routes if available */}

                {routes && routes.length > 0 && routes.map((route, index) => {
          // Use strict equality or compare based on an id property if available.
          const isSelected = selectedRoute && selectedRoute === route;
          if (!(route.routeGeoJSON)) return null;
          return (
            <MapboxGL.ShapeSource key={`route-${index}`} id={`route-${index}`} shape={route.routeGeoJSON}>
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
});

export default Map;
