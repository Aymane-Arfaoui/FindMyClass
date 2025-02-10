import React, {useEffect, useRef, useState} from 'react';
import MapboxGL from '@rnmapbox/maps';
import {StyleSheet, View} from 'react-native';
import {theme} from "@/constants/theme";
import {getUserLocation} from "@/services/userService";
import {concordiaBuildingsGeoJSON} from "@/constants/concordiaBuildings";

MapboxGL.setAccessToken('sk.eyJ1Ijoicnd6IiwiYSI6ImNtNm9peDZhdzE4NmQya3E0azV4dmYxenMifQ.5SH51Urj6KLeo-SHYbRTPw');

const Map = ({onBuildingPress, selectedLocation, onMapPress}) => {
    const cameraRef = useRef(null);
    const [centerCoordinate, setCenterCoordinate] = useState([-73.5789, 45.4960]);
    const [userLocation, setUserLocation] = useState(null);

    useEffect(() => {
        if (selectedLocation && cameraRef.current) {
            cameraRef.current.flyTo(selectedLocation, 800);
        }
    }, [selectedLocation]);

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const location = await getUserLocation();
                setUserLocation({
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [location.lng, location.lat],
                    },
                });
                setCenterCoordinate([location.lng, location.lat]);
            } catch (error) {
                // console.error("Error fetching user location:", error);
            }
        };

        fetchLocation();
        const interval = setInterval(fetchLocation, 5000);
        return () => clearInterval(interval);
    }, []);

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
                    centerCoordinate={selectedLocation || centerCoordinate}
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
});

export default Map;
