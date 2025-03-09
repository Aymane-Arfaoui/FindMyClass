import React from "react";
import {ActivityIndicator, Animated, Image, StyleSheet, Text, TouchableOpacity, View,} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {theme} from "@/constants/theme";
import { useNavigation } from "@react-navigation/native";
import PropTypes from "prop-types";

const DEFAULT_IMAGE_URL = "https://www.kpmb.com/wp-content/uploads/2016/06/0004_N76_300dpi-scaled.jpg";


function hasIndoorMap(buildingName = "") {
    const lower = buildingName.toLowerCase();
    let buildingKey = null;

    if (lower.includes("hall building")) {
        buildingKey = "Hall";
    } else if (lower.includes("john molson") || lower.includes("mb ")) {
        buildingKey = "MB";
    } else if (lower.includes("cc") || lower.includes("central building")) {
        buildingKey = "CC";
    }

    return buildingKey;
}


function BuildingDetailsPanel({
                                  selectedBuilding,
                                  buildingDetails,
                                  panHandlers,
                                  panelY,
                                  onClose,
                                  onDirectionPress,
                                  currentLocation,
                                  mode,
                                  GOOGLE_PLACES_API_KEY,
                                  loading
                              }) {
    const buildingKey = hasIndoorMap(selectedBuilding?.name);
    const navigation = useNavigation();
    return (
        <Animated.View
            {...panHandlers}
            style={[styles.bottomPanel, {transform: [{translateY: panelY}]}]}
        >
            <TouchableOpacity
                onPress={onClose}
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
                                {buildingDetails.photos && buildingDetails.photos.length > 0 ? (
                                    <Image
                                        source={{
                                            uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${buildingDetails.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`,
                                        }}
                                        style={styles.buildingImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Image
                                        source={{uri: DEFAULT_IMAGE_URL}}
                                        style={styles.buildingImage}
                                        resizeMode="cover"
                                    />
                                )}

                                <Text style={styles.buildingDetails}>
                                    {buildingDetails.formatted_address}
                                </Text>
                            </>
                        )}


                    <TouchableOpacity style={styles.directionButton}
                                      onPress={(_event) => onDirectionPress(currentLocation, selectedBuilding, mode)}>
                        <Ionicons name="navigate-circle" size={22} color={theme.colors.white}/>
                        <Text style={styles.directionButtonText}>Get Directions</Text>
                    </TouchableOpacity>
                    {buildingKey && (
                        <TouchableOpacity
                            style={styles.indoorMapButton}
                            onPress={() => {
                                navigation.navigate("MapScreen", { buildingKey });
                            }}
                        >
                            <Ionicons name="map" size={22} color={theme.colors.white} />
                            <Text style={styles.indoorMapButtonText}>Indoor Map</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}
        </Animated.View>
    );
};

BuildingDetailsPanel.propTypes={
    selectedBuilding:PropTypes.any,
    buildingDetails:PropTypes.any,
    panHandlers:PropTypes.any,
    panelY:PropTypes.any,
    onClose:PropTypes.func,
    onDirectionPress:PropTypes.func,
    currentLocation:PropTypes.any,
    mode:PropTypes.string,
    GOOGLE_PLACES_API_KEY:PropTypes.string,
    loading:PropTypes.bool,

}

export default BuildingDetailsPanel;

const styles = StyleSheet.create({
    bottomPanel: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        backgroundColor: theme.colors.white,
        padding: 20,
        paddingBottom: 25,
        borderTopLeftRadius: theme.radius.xxl,
        borderTopRightRadius: theme.radius.xxl,
        shadowColor: theme.colors.dark,
        shadowOffset: {width: 0, height: -3},
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
        shadowColor: theme.colors.dark,
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
        height: 180,
        borderRadius: 15,
        marginBottom: 12,
        backgroundColor: "#f0f0f0",
        alignSelf: "center",
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
    indoorMapButton: {
        flexDirection: "row",
        marginTop: 12,
        backgroundColor: theme.colors.blueDark,
        paddingVertical: 14,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: theme.colors.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 6,
    },
    indoorMapButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 8,
    },


});