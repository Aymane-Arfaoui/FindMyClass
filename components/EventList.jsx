import React, {useContext, useEffect, useMemo, useState} from "react";
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import EditTasks from "@/components/EditTasks";
import PropTypes from "prop-types";
import { ThemeContext } from '@/context/ThemeProvider';


export const getLocalDateString = (dateInput) => {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-CA");
};

const EventList = ({events, onUpdate, isPlanRouteMode = false, onSelectForRoute, resetSelectionFlag}) => {
    const [selectedRouteIds, setSelectedRouteIds] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isEditVisible, setIsEditVisible] = useState(false);
    const [routeSelectionDate, setRouteSelectionDate] = useState(null);
    const { theme } = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);

    useEffect(() => {
        setSelectedRouteIds([]);
        setRouteSelectionDate(null);
    }, [resetSelectionFlag]);

    const handleEditPress = (event) => {
        const taskData = {
            id: event.id,
            taskName: event.summary || "",
            notes: event.description || "",
            address: event.location || "",
            date: event.start?.dateTime ? new Date(event.start.dateTime) : new Date(),
            startTime: event.start?.dateTime ? new Date(event.start.dateTime) : "All Day",
            endTime: event.end?.dateTime ? new Date(event.end.dateTime) : "All Day",
            allDayEvent: event.allDayEvent || false,
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
                events.map((event, index) => {
                    const isSelected = selectedRouteIds.includes(event.id);

                    const handleSelect = () => {
                        const eventDate = event.start?.date || getLocalDateString(event.start?.dateTime || event.date);
                        let updated = [...selectedRouteIds];
                        if (isSelected) {
                            updated = updated.filter(id => id !== event.id);
                            if (updated.length === 0) {
                                setRouteSelectionDate(null);
                            }
                        } else {
                            if (!event.location || event.location.trim() === "") {
                                alert("This event has no address and cannot be added to your route.");
                                return;
                            }

                            if (!routeSelectionDate) {
                                setRouteSelectionDate(eventDate);
                            } else if (eventDate !== routeSelectionDate) {
                                alert("You can only select events from the same day.");
                                return;
                            }

                            updated.push(event.id);
                        }

                        setSelectedRouteIds(updated);

                        const selectedEvents = events.filter(e => updated.includes(e.id));
                        const routeDict = {};
                        selectedEvents.forEach((e, idx) => {
                            routeDict[(idx + 1).toString()] = [
                                e.summary,
                                e.location || "No location",
                                eventDate,
                                e.start?.dateTime
                                    ? new Date(e.start.dateTime).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })
                                    : "All day"
                            ];
                        });

                        onSelectForRoute(routeDict);
                    };


                    return (
                        <View
                            key={event.id || index}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 10,
                                paddingLeft: isPlanRouteMode ? 0 : 10,
                                paddingRight: 75,
                            }}
                        >
                            <View style={{width: 70, marginRight: 10, alignItems: 'center'}}>
                                {isPlanRouteMode ? (

                                    <TouchableOpacity onPress={handleSelect} style={styles.selectCircleWrapper} testID={'select-event-button'}>
                                        <View style={[
                                            styles.selectCircle,
                                            isSelected && styles.selectCircleSelected
                                        ]}/>
                                    </TouchableOpacity>
                                ) : (
                                    <Text style={{fontSize: 15, fontWeight: '600', color: theme.colors.grayDark}}>
                                        {event.start?.dateTime
                                            ? new Date(event.start.dateTime).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                            : 'All day'}
                                    </Text>
                                )}
                            </View>
                            <View style={[
                                styles.eventCard,
                                event.itemType === 'task' ? styles.taskCard : styles.calendarCard
                            ]}>
                                <View style={[
                                    styles.cardAccent,
                                    event.itemType === 'task' ? styles.taskAccent : styles.calendarAccent
                                ]}/>

                                {/* Event Details */}
                                <View style={styles.eventDetails}>
                                    <View style={styles.eventHeader}>
                                        <Text style={[
                                            styles.eventTitle,
                                            event.itemType === 'task' ? styles.taskTitle : styles.calendarTitle
                                        ]}>
                                            {event.summary}
                                        </Text>
                                        {event.itemType === 'event' && (
                                            <View style={[
                                                styles.calendarSourceBadge,
                                                {backgroundColor: theme.colors.primary || theme.colors.blueDark}
                                            ]}>
                                                <Text style={styles.calendarSourceText}>
                                                    {event.calendarName === 'Main' ? 'Main' :
                                                        event.calendarName.includes('@') ?
                                                            event.calendarName.split('@')[0] :
                                                            event.calendarName}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text
                                        style={styles.eventSubtitle}>{event.description || "No additional details"}</Text>
                                    <View style={styles.locationContainer}>
                                        <Ionicons name="location-outline" size={16} color={theme.colors.grayDark}/>
                                        <Text
                                            style={styles.eventLocation}>{event.location || "No location available"}</Text>
                                    </View>
                                </View>

                                {/* Edit button only for tasks */}
                                {event.itemType === 'task' && (
                                    <TouchableOpacity
                                        testID={'edit-button'}
                                        style={styles.editButton}
                                        onPress={() => handleEditPress(event)}
                                    >
                                        <Ionicons name="ellipsis-vertical" size={22} color={theme.colors.grayDark}/>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    );
                })
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

EventList.propTypes={
    events:PropTypes.any,  onUpdate:PropTypes.func, isPlanRouteMode:PropTypes.bool, onSelectForRoute: PropTypes.func, resetSelectionFlag:PropTypes.any
}
export default EventList;

const createStyles = (theme) => StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    selectCircleWrapper: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },

    selectCircle: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'transparent',
    },

    selectCircleSelected: {
        backgroundColor: theme.colors.primary,
    },
    eventCard: {
        flexDirection: "row",
        backgroundColor: theme.colors.SmartPlannerCards,
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        alignItems: "center",
        overflow: 'hidden',
    },
    eventHeaderText: {
        fontSize: 13,
        fontWeight: '600',
        color: theme.colors.grayDark,
        width: 70,
        textAlign: 'left',
    },

    cardAccent: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
    },
    taskAccent: {
        backgroundColor: theme.colors.secondaryDark,
    },
    calendarAccent: {
        backgroundColor: theme.colors.primary,
    },
    taskCard: {
        backgroundColor: theme.colors.SmartPlannerCards,
    },
    calendarCard: {
        backgroundColor: theme.colors.SmartPlannerCards,
    },
    eventTimeContainer: {
        width: 80,
        marginRight: 10,
        alignItems: "center",
        marginLeft: 8,
    },
    eventTime: {
        fontSize: 14,
        fontWeight: "600",
    },
    taskTime: {
        color: theme.colors.primary,
    },
    calendarTime: {
        color: theme.colors.blueDark,
    },
    eventDetails: {
        flex: 1,
    },
    eventHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: "600",
    },
    taskTitle: {
        color: theme.colors.dark,
    },
    calendarTitle: {
        color: theme.colors.dark,
    },
    eventSubtitle: {
        fontSize: 14,
        color: theme.colors.textLight,
        marginTop: 2,
    },
    eventLocation: {
        fontSize: 14,
        color: theme.colors.textLight,
        marginLeft: 6,
    },
    noEventsContainer: {
        alignItems: "center",
        paddingVertical: 20,
    },
    noEventsText: {
        fontSize: 16,
        color: theme.colors.textLight,
    },
    locationContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 5,
    },
    editButton: {
        padding: 8,
    },
    calendarSourceBadge: {
        backgroundColor: theme.colors.blueDark,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 8,
        opacity: 0.9,
    },
    calendarSourceText: {
        color: theme.colors.textCalendar,
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
});