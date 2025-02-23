import React, {useState} from "react";
import {Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {FontAwesome} from "@expo/vector-icons";
import {theme} from "@/constants/theme";

const BottomPanel = ({transportMode, routeDetails, routes}) => {
    const [expanded, setExpanded] = useState(false);
    const animatedHeight = useState(new Animated.Value(100))[0];

    const toggleExpand = () => {
        Animated.timing(animatedHeight, {
            toValue: expanded ? 100 : 350,
            duration: 300,
            useNativeDriver: false,
        }).start();
        setExpanded(!expanded);
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
            {expanded && (
                <ScrollView style={{marginTop: 10}}>
                    {routes?.length > 0 ? (
                        routes.map((route, index) => (
                            <View key={index} style={styles.stepsContainer}>
                                <Text style={styles.stepText}>
                                    {route.mode.toUpperCase()} – {route.duration} – {route.distance}
                                </Text>
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
});

export default BottomPanel;
