import React, {useState} from "react";
import {Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {FontAwesome} from "@expo/vector-icons";
import {theme} from "@/constants/theme";

const BottomPanel = ({transportMode, routeDetails, routes}) => {
    const [expanded, setExpanded] = useState(false);
    const animatedHeight = useState(new Animated.Value(100))[0];
    const [selectedRoute, setSelectedRoute] = useState(null); // Store the selected route

    const toggleExpand = () => {
        Animated.timing(animatedHeight, {
            toValue: expanded ? 100 : 600,
            duration: 300,
            useNativeDriver: false,
        }).start();
        setExpanded(!expanded);
    };

    const handleRouteSelection = (route) => {
        setSelectedRoute(route);
        // setExpanded(false);
    };



    return (
        <Animated.View style={[styles.container, {height: animatedHeight}]} testID={'bottom-panel'}>
            <View style={styles.slideIndicator}/>
            <View style={styles.content}>
                {routeDetails ? (
                    <View testID={'route-details'}>
                        <Text style={styles.text}>{`Duration: ${routeDetails.duration}`}</Text>
                        <Text style={styles.subText}>{`Distance: ${routeDetails.distance}`}</Text>
                    </View>
                ) : (
                    <Text style={styles.text}>No route available</Text>
                )}


                <TouchableOpacity testID={'toggle-button'} style={styles.button} onPress={toggleExpand}>
                    <FontAwesome testID={'chevron'} name={expanded ? "chevron-down" : "chevron-up"} size={20}
                                 color="white"/>
                </TouchableOpacity>
            </View>



            {/*<View style={styles.content}>*/}

            {/*    {selectedRoute ? (*/}
            {/*        <View testID={'route-details'}>*/}
            {/*            <Text style={styles.text}>{`Mode: ${selectedRoute.mode.toUpperCase()}`}</Text>*/}
            {/*            <Text style={styles.subText}>{`Duration: ${selectedRoute.duration}`}</Text>*/}
            {/*            <Text style={styles.subText}>{`Distance: ${selectedRoute.distance}`}</Text>*/}
            {/*            <Text style={styles.subText}>{`INFO: */}
            {/*            ${selectedRoute.steps[0].instruction} */}
            {/*            ${selectedRoute.steps[0].distance} */}
            {/*            ${selectedRoute.steps[0].maneuver}*/}
            {/*            `}</Text>*/}
            {/*        </View>*/}
            {/*    ) : (*/}
            {/*        <Text style={styles.text}>No route selected</Text>*/}
            {/*    )}*/}

            {/*</View>*/}

            <ScrollView style={{minHeight: 0, maxHeight: 700, backgroundColor: "#ffffff"}}>
            <View style={styles.content}>
                {selectedRoute ? (
                    <View testID={'route-details'}>
                        <Text style={styles.text}>{`Mode: ${selectedRoute.mode.toUpperCase()}`}</Text>
                        <Text style={styles.subText}>{`Duration: ${selectedRoute.duration}`}</Text>
                        <Text style={styles.subText}>{`Distance: ${selectedRoute.distance}`}</Text>

                        <Text style={[styles.text, { marginTop: 10 }]}>Step-by-step Directions:</Text>

                        {selectedRoute.steps && selectedRoute.steps.length > 0 ? (
                            selectedRoute.mode === "transit" ? (
                                selectedRoute.steps.map((step, index) => (
                                    <View key={index} style={styles.stepContainer}>
                                        <Text style={styles.stepText}>{`Step ${index + 1}: ${step.instruction}`}</Text>
                                        <Text style={styles.stepSubText}>{`Vehicle: ${step.vehicle || "N/A"}`}</Text>
                                        <Text style={styles.stepSubText}>{`From: ${step.departure_time || "N/A"} to ${step.arrival_time || "N/A"}`}</Text>
                                        <Text style={styles.stepSubText}>{`Stops: ${step.num_stops || 0}`}</Text>
                                    </View>
                                ))
                            ) : (
                                selectedRoute.steps.map((step, index) => (
                                    <View key={index} style={styles.stepContainer}>
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
            </ScrollView>



            {expanded && (
                <ScrollView style={{marginTop: 10}}>
                    {routes?.length > 0 ? (
                        routes.map((route, index) => (
                            <View key={index} style={styles.stepsContainer}>
                                <Text style={styles.stepText}>
                                    {route.mode.toUpperCase()} – {route.duration} – {route.distance}
                                </Text>

                                <TouchableOpacity testID={'switch-route-button'} style={styles.switchRouteButton} onPress={() => handleRouteSelection(route)}>
                                        <View style={styles.switchRouteContent}>
                                            <Text style={styles.switchRouteText}>Go</Text>
                                            <FontAwesome testID={'chevron'} name={"chevron-right"} size={20} color="white" />
                                        </View>
                                    </TouchableOpacity>


                            </View>

                        ))
                    ) : (
                        <Text style={styles.text}>
                            No routes found for {transportMode}.
                        </Text>
                    )}
                </ScrollView>
            )}

        </Animated.View>
    );
};


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
        shadowColor: "#000",
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    slideIndicator: {
        width: 40,
        height: 5,
        backgroundColor: "#ccc",
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
        color: "#333",
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
        fontSize: 16,
        marginVertical: 4,
        color: "#555",
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
        borderBottomColor: "#ddd",
    },
    transportText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    transportTime: {
        fontSize: 16,
        color: "#007AFF",
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

});

export default BottomPanel;
