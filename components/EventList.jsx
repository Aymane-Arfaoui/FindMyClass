import React, {useState} from "react";
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {theme} from "@/constants/theme";
import EditTasks from "@/components/EditTasks";

const EventList = ({events, onUpdate}) => {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEditVisible, setIsEditVisible] = useState(false);

    const handleEditPress = (event) => {
        const taskData = {
            id: event.id,
            taskName: event.summary || "",
            notes: event.description || "",
            address: event.location || "",
            date: event.start?.dateTime ? new Date(event.start.dateTime) : new Date(),
            startTime: event.start?.dateTime ? new Date(event.start.dateTime) : "All Day",
            endTime: event.end?.dateTime ? new Date(event.end.dateTime) : "All Day",
        };
        setSelectedEvent(taskData);
        setIsEditVisible(true);
    };

    const handleUpdateEvent = (updatedEvent) => {
        onUpdate(updatedEvent);
        setIsEditVisible(false);
    };

    return (
        <View style={styles.container}>
            {events.length > 0 ? (
                events.map((event, index) => (
                    <View key={index} style={styles.eventCard}>
                        <View style={styles.eventTimeContainer}>
                            <Text style={styles.eventTime}>
                                {event.start?.dateTime
                                    ? new Date(event.start.dateTime).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })
                                    : "All day"}
                            </Text>
                        </View>

                        <View style={styles.eventDetails}>
                            <Text style={styles.eventTitle}>{event.summary}</Text>
                            <Text style={styles.eventSubtitle}>{event.description || "No additional details"}</Text>
                            <View style={styles.locationContainer}>
                                <Ionicons name="location-outline" size={16} color={theme.colors.grayDark}/>
                                <Text style={styles.eventLocation}>{event.location || "No location available"}</Text>
                            </View>
                        </View>

                        <TouchableOpacity onPress={() => handleEditPress(event)}>
                            <Ionicons name="ellipsis-vertical" size={22} color={theme.colors.grayDark}/>
                        </TouchableOpacity>
                    </View>
                ))
            ) : (
                <View style={styles.noEventsContainer}>
                    <Text style={styles.noEventsText}>No events scheduled for this day</Text>
                </View>
            )}

            {isEditVisible && (
                <EditTasks
                    isVisible={isEditVisible}
                    onClose={() => setIsEditVisible(false)}
                    taskData={selectedEvent}
                    onUpdate={handleUpdateEvent}
                />
            )}
        </View>
    );
};

export default EventList;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    eventCard: {
        flexDirection: "row",
        backgroundColor: theme.colors.white,
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        alignItems: "center",
    },
    eventTimeContainer: {
        width: 80,
        marginRight: 10,
        alignItems: "center",
    },
    eventTime: {
        fontSize: 14,
        fontWeight: "bold",
        color: theme.colors.dark,
        opacity: 0.8,
    },
    eventDetails: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: theme.colors.dark,
    },
    eventSubtitle: {
        fontSize: 14,
        color: theme.colors.grayDark,
        marginTop: 2,
    },
    eventLocation: {
        fontSize: 14,
        color: theme.colors.grayDark,
        marginTop: 5,
    },
    noEventsContainer: {
        alignItems: "center",
        paddingVertical: 20,
    },
    noEventsText: {
        fontSize: 16,
        color: theme.colors.grayDark,
    },
    locationContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 5,
    },
});