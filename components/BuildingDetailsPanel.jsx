import React, { useContext, useMemo } from "react";
import {
    ActivityIndicator,
    Animated,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import PropTypes from "prop-types";
import { ThemeContext } from "@/context/ThemeProvider";

const DEFAULT_IMAGE_URL = "https://www.kpmb.com/wp-content/uploads/2016/06/0004_N76_300dpi-scaled.jpg";

function hasIndoorMap(buildingName = "") {
    const lower = buildingName.toLowerCase();
    if (lower.includes("hall building")) return "Hall";
    if (lower.includes("john molson") || lower.includes("mb ")) return "MB";
    if (lower.includes("cc") || lower.includes("central building")) return "CC";
    return null;
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

    const { theme } = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <Animated.View
            {...panHandlers}
            style={[styles.bottomPanel, { transform: [{ translateY: panelY }] }]}
        >
            <TouchableOpacity
                testID={'close-button'}
                onPress={onClose}
                style={styles.closeButton}
                activeOpacity={0.7}
            >
                <Ionicons name="close-circle" size={32} color={theme.colors.dark} />
            </TouchableOpacity>

            <View style={styles.dragBar} />

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} testID={'loading-indicator'} />
            ) : (
                <>
                    <Text style={styles.buildingName}>
                        {selectedBuilding?.name || "Loading..."}
                    </Text>

                    {buildingDetails && (
                        <>
                            <Image
                                source={{
                                    uri: buildingDetails?.photos?.[0]?.name
                                        ? `https://places.googleapis.com/v1/${buildingDetails.photos[0].name}/media?maxWidthPx=1200&maxHeightPx=1200&key=${GOOGLE_PLACES_API_KEY}`
                                        : DEFAULT_IMAGE_URL
                                }}
                                style={styles.buildingImage}
                                resizeMode="cover"
                                testID={buildingDetails?.photos?.[0]?.name ? 'building-image' : 'default-image'}
                            />

                            <Text style={styles.buildingDetails}>
                                {buildingDetails.formattedAddress || "No address available"}
                            </Text>
                        </>
                    )}

                    <TouchableOpacity
                        style={styles.directionButton}
                        testID={'direction-button'}
                        onPress={() => onDirectionPress(currentLocation, selectedBuilding, mode)}
                    >
                        <Ionicons name="navigate-circle" size={22} color='#fff' />
                        <Text style={styles.directionButtonText}>Get Directions</Text>
                    </TouchableOpacity>

                    {buildingKey && (
                        <TouchableOpacity
                            testID={'indoor-map-button'}
                            style={styles.indoorMapButton}
                            onPress={() => navigation.navigate("MapScreen", { buildingKey })}
                        >
                            <Ionicons name="map" size={22} color='#fff' />
                            <Text style={styles.indoorMapButtonText}>Indoor Map</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}
        </Animated.View>
    );
}

BuildingDetailsPanel.propTypes = {
    selectedBuilding: PropTypes.any,
    buildingDetails: PropTypes.any,
    panHandlers: PropTypes.any,
    panelY: PropTypes.any,
    onClose: PropTypes.func,
    onDirectionPress: PropTypes.func,
    currentLocation: PropTypes.any,
    mode: PropTypes.string,
    GOOGLE_PLACES_API_KEY: PropTypes.string,
    loading: PropTypes.bool,
};

export default BuildingDetailsPanel;

const createStyles = (theme) => StyleSheet.create({
    bottomPanel: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        backgroundColor: theme.colors.cardBackground,
        padding: 20,
        paddingBottom: 25,
        borderTopLeftRadius: theme.radius.xxl,
        borderTopRightRadius: theme.radius.xxl,
        shadowColor: theme.colors.dark,
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 8,
    },
    closeButton: {
        position: "absolute",
        top: -15,
        right: 2,
        backgroundColor: theme.colors.cardBackground,
        borderRadius: 20,
        padding: 5,
        shadowColor: theme.colors.dark,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 6,
        zIndex: 10,
    },
    dragBar: {
        width: 40,
        height: 5,
        backgroundColor: theme.colors.textLight,
        borderRadius: 3,
        alignSelf: "center",
        marginBottom: 15,
        marginTop: -5,
        opacity: 0.8,
    },
    buildingName: {
        fontSize: 20,
        fontWeight: "bold",
        color: theme.colors.text,
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
        color: '#fff',
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
        color: '#fff',
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 8,
    },
});
