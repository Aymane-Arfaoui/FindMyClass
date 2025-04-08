import React, {useContext, useEffect, useMemo, useState} from "react";
import {Animated, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {FontAwesome} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import PropTypes from "prop-types";
import {isShuttleRunningNow } from "@/services/shuttleService";
import {ThemeContext} from "@/context/ThemeProvider";
import { fetchGoogleRoutes } from "@/services/routeService";
import { getShuttleTravelTime } from "@/services/shuttleService";
import ShuttleSchedule from "@/app/shuttleSchedule";



const SGW_COORDS = {
    latMin: 45.490,
    latMax: 45.500,
    lngMin: -73.590,
    lngMax: -73.565,
};

const LOYOLA_COORDS = {
    latMin: 45.440,
    latMax: 45.460,
    lngMin: -73.660,
    lngMax: -73.620,
};


function isInSGW(lat, lng) {
    return lat >= SGW_COORDS.latMin && lat <= SGW_COORDS.latMax && lng >= SGW_COORDS.lngMin && lng <= SGW_COORDS.lngMax;
}

function isInLoyola(lat, lng) {
    return lat >= LOYOLA_COORDS.latMin && lat <= LOYOLA_COORDS.latMax && lng >= LOYOLA_COORDS.lngMin && lng <= LOYOLA_COORDS.lngMax;
}

function hasIndoorMapBottomPanel(buildingName = "") {
    const buildingNameLowerCase = buildingName.toLowerCase();
    let buildingKey = null;

    if (buildingNameLowerCase.includes("hall building")) {
        buildingKey = "Hall";
    } else if (buildingNameLowerCase.includes("john molson") || buildingNameLowerCase.includes("mb ")) {
        buildingKey = "MB";
    } else if (buildingNameLowerCase.includes("cc") || buildingNameLowerCase.includes("central building")) {
        buildingKey = "CC";
    }

    return buildingKey;
}



const BottomPanel = ({transportMode, routeDetails, routes, wantsClassroom, selectedBuilding, travelTimes, startLocation, endLocation,}) => {
    const [expanded, setExpanded] = useState(false);
    const animatedHeight = useState(new Animated.Value(100))[0];
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const router = useRouter();

    const isShuttleActive = isShuttleRunningNow();

    const startInSGW = startLocation && isInSGW(startLocation.lat, startLocation.lng);
    const endInSGW = endLocation && isInSGW(endLocation.lat, endLocation.lng);
    const startInLoyola = startLocation && isInLoyola(startLocation.lat, startLocation.lng);
    const endInLoyola = endLocation && isInLoyola(endLocation.lat, endLocation.lng);

    const isInterCampusTrip = (startInSGW && endInLoyola) || (startInLoyola && endInSGW);

    useEffect(() => {
        setSelectedRoute(routeDetails);
    }, [routeDetails]);


    const toggleExpand = () => {
        Animated.timing(animatedHeight, {
            toValue: expanded ? 100 : 350,
            duration: 300,
            useNativeDriver: false,
        }).start();
        setExpanded(!expanded);
    };

    const handleRouteSelection = async (route) => {
        if (route.mode === 'shuttle') {
            try {
                const SGW_STOP = { lat: 45.497222635211905, lng: -73.578487816744 };
                const LOYOLA_STOP = { lat: 45.457573940756085, lng: -73.63905110366196 };

                const fromSGW = isInSGW(startLocation.lat, startLocation.lng);
                const originStop = fromSGW ? SGW_STOP : LOYOLA_STOP;
                const destinationStop = fromSGW ? LOYOLA_STOP : SGW_STOP;

                const walkToStop = await fetchGoogleRoutes(
                    `${startLocation.lat},${startLocation.lng}`,
                    `${originStop.lat},${originStop.lng}`,
                    'walking'
                );

                const walkFromStop = await fetchGoogleRoutes(
                    `${destinationStop.lat},${destinationStop.lng}`,
                    `${endLocation.lat},${endLocation.lng}`,
                    'walking'
                );

                const shuttleDetails = getShuttleTravelTime();

                // Helpers
                const parseMinutes = (durationStr) => {
                    const match = durationStr?.match(/(\d+)\s*min/);
                    return match ? parseInt(match[1], 10) : 0;
                };

                const parseMeters = (distanceStr) => {
                    if (!distanceStr) return 0;
                    if (distanceStr.includes("km")) {
                        const match = distanceStr.match(/([\d.]+)\s*km/);
                        return match ? parseFloat(match[1]) * 1000 : 0;
                    } else {
                        const match = distanceStr.match(/(\d+)\s*m/);
                        return match ? parseInt(match[1], 10) : 0;
                    }
                };

                const formatDistance = (meters) => {
                    return meters >= 1000
                        ? `${(meters / 1000).toFixed(1)} km`
                        : `${meters} m`;
                };

                const formatDuration = (minutes) => `${minutes} min`;

                const walkTo = walkToStop[0] || {};
                const walkFrom = walkFromStop[0] || {};

                const walkToDuration = parseMinutes(walkTo.duration);
                const walkFromDuration = parseMinutes(walkFrom.duration);
                const walkToDistance = parseMeters(walkTo.distance);
                const walkFromDistance = parseMeters(walkFrom.distance);

                const shuttleDuration = parseMinutes(shuttleDetails.duration);
                const shuttleDistance = parseMeters(shuttleDetails.distance);

                const totalDuration = walkToDuration + shuttleDuration + walkFromDuration;
                const totalDistance = walkToDistance + shuttleDistance + walkFromDistance;

                const shuttleStep = {
                    instruction: `Ride the Concordia shuttle from ${fromSGW ? "SGW" : "Loyola"} to ${fromSGW ? "Loyola" : "SGW"}`,
                    vehicle: "Shuttle Bus",
                    departure_time: route.departure || "N/A",
                    arrival_time: "Approx. " + shuttleDetails.duration,
                    distance: shuttleDetails.distance,
                    num_stops: 0
                };

                const shuttleRoute = {
                    ...route,
                    duration: formatDuration(totalDuration),
                    distance: formatDistance(totalDistance),
                    steps: [
                        ...(walkToStop[0]?.steps || []),
                        shuttleStep,
                        ...(walkFromStop[0]?.steps || [])
                    ]
                };

                setSelectedRoute(shuttleRoute);
                setModalVisible(true);
            } catch (err) {
                console.error("Failed to build shuttle directions:", err);
            }
        } else {
            setSelectedRoute(route);
            setModalVisible(true);
        }
    };

    const shuttleRoutes = routes?.filter((r) => r.mode === "shuttle" && isInterCampusTrip);
    const otherTransitRoutes = routes?.filter((r) => r.mode !== "shuttle");

    const modeMapping = {
        driving: "DRIVE",
        transit: "TRANSIT",
        walking: "WALK",
        bicycling: "BICYCLE",
    };

    const matchedTime = selectedRoute ? travelTimes[modeMapping[selectedRoute.mode]] : null;


    const buildingKey = selectedBuilding ? hasIndoorMapBottomPanel(selectedBuilding.name) : null;

    const handleGoInside = () => {
        if (buildingKey) {
            setModalVisible(false)
            router.push({pathname: "MapScreen", params: {buildingKey}});
        } else {
            console.warn("No indoor map available for this building");
        }
    };
    const {theme} = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);


    return (
        <Animated.View style={[styles.container, {height: animatedHeight}]} testID={'bottom-panel'}>
            <View style={styles.slideIndicator}/>
            <View style={styles.content}>
                {routeDetails ? (
                    <View testID={'route-details'}>
                        <Text style={styles.text}>
                            Duration: {matchedTime || selectedRoute?.duration || routeDetails?.duration || "N/A"}
                        </Text>
                        <Text style={styles.subText}>
                            {selectedRoute ? `Distance: ${selectedRoute.distance}` : `Distance: ${routeDetails?.distance || 'N/A'}`}
                        </Text>

                    </View>
                ) : (
                    <Text style={styles.text}>No route available</Text>
                )}


                <TouchableOpacity testID={'toggle-button'} style={styles.button} onPress={toggleExpand}>
                    <FontAwesome testID={'chevron'} name={expanded ? "chevron-down" : "chevron-up"} size={20}
                                 color="white"/>
                </TouchableOpacity>
            </View>


            <Modal
                testID={'modal'}
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <ScrollView style={styles.stepsScroll}>

                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButtonBPup}
                                          testID={'close-button'}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>

                        <View style={styles.content}>
                            {selectedRoute ? (
                                <View testID={'selected-route-details'}>
                                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                        <Text style={styles.textHeader}>{`Mode: ${selectedRoute.mode.toUpperCase()}`}</Text>

                                        {selectedRoute.mode === "shuttle" && (
                                            <TouchableOpacity
                                                style={styles.shuttleSchedButton}
                                                onPress={() => {
                                                    setModalVisible(false);
                                                    setTimeout(() => router.push('/shuttleSchedule'), 100);
                                                }}
                                            >
                                                <Text style={styles.shuttleSchedButtonText}>Schedule</Text>
                                            </TouchableOpacity>


                                        )}
                                    </View>

                                    <Text style={styles.subTextHeader}>{`Duration: ${selectedRoute.duration}`}</Text>
                                    <Text style={styles.subTextHeader}>{`Distance: ${selectedRoute.distance}`}</Text>

                                    <Text style={[styles.subSubTextHeader, {marginTop: 10}]}>Step-by-step
                                        Directions:</Text>

                                    {selectedRoute.steps && selectedRoute.steps.length > 0 ? (
                                        selectedRoute.mode === "transit" ? (
                                            selectedRoute.steps.map((step, index) => (
                                                <View key={index} style={styles.stepContainer}>
                                                    <Text
                                                        style={styles.stepText}>{`Step ${index + 1}: ${step.instruction}`}</Text>

                                                    {step.vehicle === "Shuttle Bus" ? (
                                                        <>
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                                <Text style={[styles.stepText, { flex: 1 }]}>{`Step ${index + 1}: ${step.instruction}`}</Text>
                                                            </View>

                                                            <Text
                                                                style={styles.stepSubText}>{`Departs: ${step.departure_time || "N/A"}`}
                                                            </Text>
                                                            <Text
                                                                style={styles.stepSubText}>{`Arrives: ${step.arrival_time || "N/A"}`}
                                                            </Text>

                                                            <ShuttleSchedule />
                                                        </>
                                                    ) : (

                                                        <>
                                                            <Text style={styles.stepSubText}>
                                                                {`Distance: ${step.distance}`}
                                                            </Text>
                                                            <Text style={styles.stepSubText}>
                                                                {`Maneuver: ${step.maneuver || "Continue"}`}
                                                            </Text>
                                                        </>
                                                    )}
                                                </View>
                                            ))
                                        ) : (
                                            selectedRoute.steps.map((step, index) => (
                                                <View key={index} style={styles.stepContainer} testID={'other-mode-steps'}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                                                        <Text
                                                            style={styles.stepText}>{`Step ${index + 1}: ${step.instruction}`}
                                                        </Text>

                                                    </View>
                                                    <Text style={styles.stepSubText}>{`Distance: ${step.distance}`}</Text>
                                                    <Text style={styles.stepSubText}>{`Maneuver: ${step.maneuver || "Continue"}`}</Text>
                                                </View>
                                            ))
                                        )
                                    ) : (
                                        <Text style={styles.text}>No step-by-step instructions available.</Text>
                                    )}
                                </View>
                            ) : (
                                <Text style={styles.text}>No route selected</Text>
                            )}
                        </View>

                        {wantsClassroom && buildingKey && (
                            <TouchableOpacity
                                style={styles.goInsideButton}
                                // onPress={() => {
                                //     // Placeholder for future functionality
                                //     console.log("Go Inside pressed");
                                // }}
                                onPress={handleGoInside}
                            >
                                <Text style={styles.goInsideButtonText}>Go Inside</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButtonBP}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>


            {expanded && (
                <ScrollView style={{marginTop: 10}} testID={'expanded'}>
                    {isShuttleActive && shuttleRoutes?.map((route, index) => (
                        <View key={index} style={styles.shuttleStepsContainer}>
                            <Image source={require('@/assets/images/ConcordiaLogo.png')} style={styles.logoImage} />
                            <Text style={styles.shuttleStepText}>
                                {route.mode.toUpperCase()}
                            </Text>

                            <TouchableOpacity
                                testID={'shuttle-route-button'}
                                style={styles.shuttleSwitchRouteButton}
                                // onPress={() => router.push('/shuttleSchedule')}
                                onPress={() => handleRouteSelection(route)}>


                                <View style={styles.switchRouteContent}>
                                    <Text style={styles.shuttleSwitchRouteText}>Go</Text>
                                    <FontAwesome testID={'chevron'} name={"chevron-right"} size={20} color="white"/>
                                </View>
                            </TouchableOpacity>
                        </View>
                    ))}

                    {otherTransitRoutes?.map((route, index) => (
                        <View key={index} style={styles.stepsContainer}>
                            <Text style={styles.stepText}>
                                {route.mode.toUpperCase()} – {route.duration} – {route.distance}
                            </Text>

                            <TouchableOpacity testID={'switch-route-button'} style={styles.switchRouteButton}
                                              onPress={() => handleRouteSelection(route)}>
                                <View style={styles.switchRouteContent}>
                                    <Text style={styles.switchRouteText}>Go</Text>
                                    <FontAwesome testID={'chevron'} name={"chevron-right"} size={20} color="white"/>
                                </View>
                            </TouchableOpacity>
                        </View>
                    ))}

                    {shuttleRoutes?.length === 0 && otherTransitRoutes?.length === 0 && (
                        <Text style={styles.text}>No routes found for {transportMode}.</Text>
                    )}
                </ScrollView>
            )}
        </Animated.View>
    );
};
BottomPanel.propTypes = {
    transportMode: PropTypes.string,
    routeDetails: PropTypes.object,
    routes: PropTypes.array,
    wantsClassroom: PropTypes.bool,
    selectedBuilding: PropTypes.object,
    travelTimes: PropTypes.object,
    startLocation: PropTypes.shape({ lat: PropTypes.number, lng: PropTypes.number }),
    endLocation: PropTypes.shape({ lat: PropTypes.number, lng: PropTypes.number }),
};

const createStyles = (theme) => StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.backgroundNav,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        shadowColor: theme.colors.dark,
        shadowOffset: {width: 0, height: -1},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    slideIndicator: {
        width: 40,
        height: 5,
        backgroundColor: theme.colors.line,
        borderRadius: 10,
        alignSelf: "center",
        marginBottom: 8,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    text: {
        fontSize: 18,
        fontWeight: "bold",
        color: theme.colors.text,
    },
    subText: {
        fontSize: 16,
        color: theme.colors.textLight,
        marginTop: 2,
    },
    textHeader: {
        fontSize: 24,
        fontWeight: "bold",
        color: theme.colors.primary,
        marginBottom: 8,
    },
    subTextHeader: {
        fontSize: 18,
        color: theme.colors.text,
    },
    subSubTextHeader: {
        fontSize: 18,
        color: theme.colors.primary,
        marginTop: 10,
    },
    button: {
        backgroundColor: theme.colors.blueDark,
        padding: 10,
        borderRadius: 25,
    },
    stepsContainer: {
        marginTop: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        paddingVertical: 10,
    },
    stepContainer: {
        marginTop: 10,
        padding: 12,
        borderRadius: 12,
        backgroundColor: theme.colors.cardBackground,
        borderColor: theme.colors.cardBorder,
        borderWidth: 1,
    },
    stepText: {
        fontSize: 16,
        fontWeight: "500",
        color: theme.colors.text,
        marginBottom: 4,
    },
    stepSubText: {
        fontSize: 14,
        color: theme.colors.textLight,
    },
    switchRouteButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    switchRouteContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    switchRouteText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: "bold",
    },
    modalContainer: {
        flex: 1,
        justifyContent: "flex-end",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    stepsScroll: {
        maxHeight: "60%",
        backgroundColor: theme.colors.cardBackground,
        width: "100%",
        padding: 20,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    closeButtonBP: {
        marginTop: 20,
        backgroundColor: theme.colors.blueDark,
        borderRadius: 20,
        padding: 12,
        alignItems: "center",
        marginBottom: 50,
    },
    closeButtonBPup: {
        marginTop: 0,
        backgroundColor: theme.colors.blueDark,
        borderRadius: 20,
        padding: 12,
        alignItems: "center",
        marginBottom: 15,
    },
    closeButtonText: {
        color: theme.colors.white,
        fontWeight: "bold",
        fontSize: 16,
    },
    shuttleStepsContainer: {
        marginTop: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        paddingVertical: 10,
    },
    shuttleStepText: {
        fontSize: 16,
        color: theme.colors.text,
        fontWeight: "semibold"
    },
    shuttleSwitchRouteButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    shuttleSwitchRouteText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: "bold",
    },
    goInsideButton: {
        marginTop: 10,
        backgroundColor: theme.colors.primary,
        borderRadius: 20,
        padding: 12,
        alignItems: "center",
    },
    goInsideButtonText: {
        color: theme.colors.white,
        fontWeight: "bold",
        fontSize: 16,
    },
    shuttleSchedButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        marginLeft: 10,
    },

    shuttleSchedButtonText: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: "bold",
    },

    scheduleModalBackdrop: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },

    scheduleModalContent: {
        width: "80%",
        backgroundColor: theme.colors.cardBackground,
        padding: 20,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    logoImage: {
        width: 25,
        height: 25,
        marginRight: 10,
    },


});


export default BottomPanel;