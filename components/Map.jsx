import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { theme } from "@/constants/theme";
import { concordiaBuildingsGeoJSON } from "@/constants/concordiaBuildings";
import MapButtons from "@/components/MapButtons";

MapboxGL.setAccessToken('sk.eyJ1Ijoicnd6IiwiYSI6ImNtNm9peDZhdzE4NmQya3E0azV4dmYxenMifQ.5SH51Urj6KLeo-SHYbRTPw');
const Map = ({ onBuildingPress }) => {
    const cameraRef = useRef(null);
    const [centerCoordinate, setCenterCoordinate] = useState([-73.5789, 45.4960]); // Default SGW

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
                <MapboxGL.Camera
                    ref={cameraRef}
                    zoomLevel={16}
                    centerCoordinate={centerCoordinate}
                />

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
            </MapboxGL.MapView>

            <MapButtons onPress={setCenterCoordinate} />
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