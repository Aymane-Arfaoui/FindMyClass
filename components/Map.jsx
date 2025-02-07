import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { theme } from "@/constants/theme";
import { concordiaBuildingsGeoJSON } from "@/constants/concordiaBuildings";

MapboxGL.setAccessToken('sk.eyJ1Ijoicnd6IiwiYSI6ImNtNm9peDZhdzE4NmQya3E0azV4dmYxenMifQ.5SH51Urj6KLeo-SHYbRTPw');

const Map = ({ onBuildingPress, selectedLocation }) => {
    const cameraRef = useRef(null);
    const [centerCoordinate, setCenterCoordinate] = useState([-73.5789, 45.4960]); // Default SGW
    const mapRef = useRef(null);

    useEffect(() => {
        if (selectedLocation && mapRef.current) {
            mapRef.current.setCamera({
                centerCoordinate: selectedLocation,
                zoomLevel: 15,
                animationDuration: 2000,
            });
        }
    }, [selectedLocation]);

    useEffect(() => {
        if (cameraRef.current && centerCoordinate) {
            cameraRef.current.flyTo(centerCoordinate, 800);
        }
    }, [centerCoordinate]);

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
            >
                <MapboxGL.ShapeSource
                    id="concordia-buildings"
                    shape={concordiaBuildingsGeoJSON}
                    onPress={(event) => {
                        if (event.features.length > 0) {
                            const feature = event.features[0];
                            onBuildingPress(feature.properties);
                        }
                    }}
                >
                    <MapboxGL.FillLayer id="building-fill" style={styles.buildingFill}/>
                    <MapboxGL.SymbolLayer id="building-labels" style={styles.buildingLabel}/>
                </MapboxGL.ShapeSource>
                <MapboxGL.Camera
                    zoomLevel={16}
                    centerCoordinate={selectedLocation || [-73.5788, 45.4973]}
                    animationMode="flyTo"
                    animationDuration={2000}
                />
                {selectedLocation && (
                    <MapboxGL.PointAnnotation
                        id="selected-location"
                        coordinate={selectedLocation}
                    />
                )}
            </MapboxGL.MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    buildingFill: {
        fillColor: ["get", "color"],
        fillOpacity: 0.8,
        fillOutlineColor: theme.colors.primaryDark,
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
});

export default Map;