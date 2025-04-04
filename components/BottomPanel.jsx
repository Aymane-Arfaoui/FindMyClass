import React, {useEffect, useState} from "react";
import {Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {FontAwesome} from "@expo/vector-icons";
import {theme} from "@/constants/theme";
import {useRouter} from "expo-router";
import PropTypes from "prop-types";
import {isShuttleRunningNow} from "@/services/shuttleService";



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


const BottomPanel = ({ transportMode, routeDetails, routes, wantsClassroom, selectedBuilding, travelTimes }) => {
    const [expanded, setExpanded] = useState(false);
    const animatedHeight = useState(new Animated.Value(100))[0];
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const router = useRouter();

    const isShuttleActive = isShuttleRunningNow();

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

    const handleRouteSelection = (route) => {
        setSelectedRoute(route);
        setModalVisible(true);

    };

    const shuttleRoutes = routes?.filter((r) => r.mode === "shuttle");
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
            router.push({ pathname: "MapScreen", params: { buildingKey } });
        } else {
            console.warn("No indoor map available for this building");
        }
    };


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

                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButtonBPup} testID={'close-button'}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>

                        <View style={styles.content}>
                            {selectedRoute ? (
                                <View testID={'selected-route-details'}>
                                    <Text style={styles.textHeader}>{`Mode: ${selectedRoute.mode.toUpperCase()}`}</Text>
                                    <Text style={styles.subTextHeader}>{`Duration: ${selectedRoute.duration}`}</Text>
                                    <Text style={styles.subTextHeader}>{`Distance: ${selectedRoute.distance}`}</Text>

                                    <Text style={[styles.subSubTextHeader, { marginTop: 10 }]}>Step-by-step Directions:</Text>

                                    {selectedRoute.steps && selectedRoute.steps.length > 0 ? (
                                        selectedRoute.mode === "transit" ? (
                                            selectedRoute.steps.map((step, index) => (
                                                <View key={index} style={styles.stepContainer} testID={'transit-steps'}>
                                                    <Text style={styles.stepText}>{`Step ${index + 1}: ${step.instruction}`}</Text>
                                                    <Text style={styles.stepSubText}>{`Vehicle: ${step.vehicle || "N/A"}`}</Text>
                                                    <Text style={styles.stepSubText}>{`From: ${step.departure_time || "N/A"} to ${step.arrival_time || "N/A"}`}</Text>
                                                    <Text style={styles.stepSubText}>{`Stops: ${step.num_stops || 0}`}</Text>
                                                </View>
                                            ))
                                        ) : (
                                            selectedRoute.steps.map((step, index) => (
                                                <View key={index} style={styles.stepContainer} testID={'other-mode-steps'}>
                                                    <Text style={styles.stepText}>{`Step ${index + 1}: ${step.instruction}`}</Text>
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
                            <Text style={styles.shuttleStepText}>
                                {route.mode.toUpperCase()} – {route.duration} – {route.distance}
                            </Text>

                            <TouchableOpacity
                                testID={'shuttle-route-button'}
                                style={styles.shuttleSwitchRouteButton}
                                onPress={() => router.push('/shuttleSchedule')}
                            >
                                <View style={styles.switchRouteContent}>
                                    <Text style={styles.shuttleSwitchRouteText}>Go</Text>
                                    <FontAwesome testID={'chevron'} name={"chevron-right"} size={20} color="white" />
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
BottomPanel.propTypes={
    transportMode:PropTypes.string,
    routeDetails:PropTypes.object,
    routes:PropTypes.array,
    wantsClassroom: PropTypes.bool,
    selectedBuilding: PropTypes.object,
    travelTimes: PropTypes.object
}


const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "white",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        shadowColor: theme.colors.dark,
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    slideIndicator: {
        width: 40,
        height: 5,
        backgroundColor: theme.colors.gray,
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
        color: theme.colors.primary,
    },
    textHeader: {
        fontSize: 30,
        fontWeight: "bold",
        color: theme.colors.primary,
    },
    subTextHeader: {
        fontSize: 20,
        fontWeight: "bold",
        color: theme.colors.dark,
    },
    subSubTextHeader: {
        fontSize: 20,
        fontWeight: "bold",
        color: theme.colors.primary,
    },
    button: {
        backgroundColor: theme.colors.blueDark,
        padding: 10,
        borderRadius: 25,
    },
    stepsContainer: {
        marginTop: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        paddingVertical: 10,
    },
    stepText: {
        fontSize: 17,
        marginVertical: 4,
        color: theme.colors.dark,
    },
    publicTransportContainer: {
        marginTop: 10,
        alignItems: "center",
    },
    transportOption: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray,
    },
    transportText: {
        fontSize: 16,
        fontWeight: "600",
        color: theme.colors.text,
    },
    transportTime: {
        fontSize: 16,
        color: theme.colors.blueLight,
    },
    switchRouteButton: {
        backgroundColor: theme.colors.blueLight,
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 15,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",

    },
    stepContainer: {
        marginTop: 10,
        padding: 10,
        borderRadius: 10,
        backgroundColor: theme.colors.gray,
    },

    switchRouteContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    switchRouteText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },

    modalContainer: {
        flex: 1,
        justifyContent: "flex-end",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 10,
        width: "80%",
        alignItems: "center",
    },
    closeButtonBP: {
        marginTop: 20,
        backgroundColor: theme.colors.blueDark,
        borderRadius: theme.radius.md,
        padding: 12,
        marginBottom: 50,
        alignItems: "center",

    },
    closeButtonBPup:{
        marginTop: 0,
        backgroundColor: theme.colors.blueDark,
        borderRadius: theme.radius.md,
        padding: 12,
        marginBottom: 15,
        alignItems: "center",

    },
    closeButtonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,

    },
    stepsScroll: {
        maxHeight: "60%",
        backgroundColor: theme.colors.white,
        width: "100%",
        paddingTop: 20,
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 20,

    },
    shuttleStepsContainer: {
        marginTop: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        paddingVertical: 10,
    },
    shuttleStepText: {
        fontSize: 16,
        marginVertical: 4,
        color: theme.colors.text,
    },
    shuttleSwitchRouteButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 15,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
    },
    shuttleSwitchRouteText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: theme.fonts.bold,
    },
    goInsideButton: {
        marginTop: 10,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.md,
        padding: 12,
        alignItems: "center",
    },
    goInsideButtonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },


});

export default BottomPanel;