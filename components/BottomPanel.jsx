import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

const BottomPanel = ({ transportMode }) => {
    const [expanded, setExpanded] = useState(false);

    const steps = [
        "Start at John Molson School of Business",
        "Walk to Guy-Concordia Metro Station",
        "Take Line 1 Metro to Berri-UQAM",
        "Exit and walk to destination",
    ];

    const publicTransportOptions = [
        { type: "Bus", number: "24", time: "5 min" },
        { type: "Metro", line: "1", time: "10 min" },
        { type: "Walk", time: "3 min" },
    ];

    return (
        <View style={[styles.container, expanded && styles.expanded]}>
            <View style={styles.slideIndicator} />
            <View style={styles.content}>
                <Text style={styles.text}>3 min (180 m)</Text>
                <TouchableOpacity style={styles.button} onPress={() => setExpanded(!expanded)}>
                    <FontAwesome name={expanded ? "chevron-down" : "chevron-up"} size={24} color="white" />
                </TouchableOpacity>
            </View>
            {expanded && transportMode !== "transit" && (
                <ScrollView style={styles.stepsContainer}>
                    {steps.map((step, index) => (
                        <Text key={index} style={styles.stepText}>{`• ${step}`}</Text>
                    ))}
                </ScrollView>
            )}
            {expanded && transportMode === "transit" && (
                <View style={styles.publicTransportContainer}>
                    {publicTransportOptions.map((option, index) => (
                        <View key={index} style={styles.transportOption}>
                            <Text style={styles.transportText}>{
                                option.type === "Bus" || option.type === "Metro"
                                    ? `${option.type} ${option.number || option.line}`
                                    : option.type
                            }</Text>
                            <Text style={styles.transportTime}>{option.time}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "white",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    expanded: {
        height: 350,
    },
    slideIndicator: {
        width: 40,
        height: 5,
        backgroundColor: "#ccc",
        borderRadius: 10,
        marginBottom: 8,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
    },
    text: {
        fontSize: 18,
        fontWeight: "bold",
    },
    button: {
        backgroundColor: "#007AFF",
        padding: 12,
        borderRadius: 50,
    },
    stepsContainer: {
        marginTop: 10,
        width: "100%",
    },
    stepText: {
        fontSize: 16,
        marginVertical: 4,
    },
    publicTransportContainer: {
        marginTop: 10,
        width: "100%",
        alignItems: "center",
    },
    transportOption: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "90%",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    transportText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    transportTime: {
        fontSize: 16,
        color: "#007AFF",
    },
});

export default BottomPanel;
