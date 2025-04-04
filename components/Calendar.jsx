import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Calendar as RNCalendar} from 'react-native-calendars';
import {theme} from '@/constants/theme';
import {hp} from '@/helpers/common';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {fetchBuildingCoordinates} from "@/services/buildingService";
import {calendarService} from '@/services/calendarService';
import PropTypes from "prop-types";


const Calendar = ({events: propEvents}) => {
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [selectedDate, setSelectedDate] = useState(getLocalDate());
    const [activeEvent, setActiveEvent] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const updateEvents = useCallback((newEvents) => {
        setEvents(newEvents);
        setIsRefreshing(false);
    }, []);

    useEffect(() => {
        calendarService?.addListener(updateEvents);
        loadEvents();
        loadTasks();

        const fetchEventsOnMount = async () => {
            const storedEvents = await AsyncStorage.getItem("@calendar");
            if (storedEvents) {
                setEvents(JSON.parse(storedEvents));
            }
            const token = await AsyncStorage.getItem("@accessToken");
            if (token) {
                await calendarService?.fetchAndUpdateEvents(token);
            }
        };
        fetchEventsOnMount();

        return () => {
            calendarService?.removeListener(updateEvents);
        };
    }, [updateEvents, propEvents]);

    function getLocalDate() {
        return new Date().toLocaleDateString('en-CA');
    }

    function formatDateToLocalDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-CA');
    }

    const loadTasks = async () => {
        try {
            const tasksJson = await AsyncStorage.getItem('tasks');
            if (tasksJson) {
                const loadedTasks = JSON.parse(tasksJson);
                setTasks(loadedTasks);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    };

    const loadEvents = async () => {
        if (propEvents && propEvents.length > 0) {
            setEvents(propEvents);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        const token = await AsyncStorage.getItem("@accessToken");
        if (token) {
            await calendarService?.fetchAndUpdateEvents(token);
        } else {
            setIsRefreshing(false);
            console.warn("No access token found. Please sign in again.");
        }
    };

    // Combine events and tasks for marking dates
    const markedDates = [...events, ...tasks.map(task => ({
        start: {dateTime: task.date},
        type: 'task'
    }))].reduce((acc, item) => {
        const eventDate = item.start?.dateTime
            ? formatDateToLocalDate(item.start.dateTime)
            : item.start?.date;
        if (eventDate) {
            acc[eventDate] = {
                marked: true,
                dotColor: item.type === 'task' ? theme.colors.secondary : theme.colors.primary,
            };
        }
        return acc;
    }, {});

    if (selectedDate) {
        markedDates[selectedDate] = {
            ...markedDates[selectedDate],
            selected: true,
            selectedColor: theme.colors.lightPrimary,
        };
    }

    // Get both events and tasks for selected date
    const selectedDateEvents = events.filter(event => {
        const eventDate = event.start?.dateTime
            ? formatDateToLocalDate(event.start.dateTime)
            : event.start?.date;
        return eventDate === selectedDate;
    });

    const selectedDateTasks = tasks.filter(task => {
        try {
            const taskDate = formatDateToLocalDate(task.date);
            return taskDate === selectedDate;
        } catch (error) {
            console.error('Error processing task date:', error, 'Task:', task);
            return false;
        }
    });

    // Combine and sort all items for the selected date
    const allItems = [
        ...selectedDateEvents.map(event => ({...event, itemType: 'event'})),
        ...selectedDateTasks.map(task => ({
            itemType: 'task',
            summary: task.taskName,
            location: task.address,
            description: task.notes,
            start: {
                dateTime: task.allDayEvent ? null : task.startTime
            },
            end: {
                dateTime: task.allDayEvent ? null : task.endTime
            },
            allDayEvent: task.allDayEvent,
            id: task.id
        }))
    ].sort((a, b) => {
        if (a.allDayEvent) return -1;
        if (b.allDayEvent) return 1;
        const aTime = a.start?.dateTime ? new Date(a.start.dateTime) : new Date(0);
        const bTime = b.start?.dateTime ? new Date(b.start.dateTime) : new Date(0);
        return aTime - bTime;
    });

    const formattedSelectedDate = new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }).format(new Date(selectedDate + 'T00:00:00'));

    const handleGetDirections = async (event) => {
        if (!event.location) {
            console.warn("No location available for this event.");
            return;
        }

        try {
            const coordinates = await fetchBuildingCoordinates(event.location);
            const roomNumber = event.location.split('Rm')[1]?.trim();

            if (coordinates) {
                console.warn(`Coordinates found: lat=${coordinates.latitude}, lng=${coordinates.longitude}, room=${roomNumber}`);
                const encodedAddress = encodeURIComponent(event.location);
                router.push({
                    pathname: "/homemap",
                    params: {
                        lat: coordinates.latitude.toString(),
                        lng: coordinates.longitude.toString(),
                        room: roomNumber,
                        address: encodedAddress,
                        directionsTriggered: 'true'
                    }
                });

            } else {
                console.error("Failed to fetch building coordinates.");
            }
        } catch (error) {
            console.error('Error fetching building coordinates:', error);
        }
    };

    const handleEventPress = (event) => {
        setActiveEvent(activeEvent?.id === event.id ? null : event);
    };

    return (
        <View style={styles.container} testID={'calendar'}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.dark}/>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Calendar</Text>
                <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing} testID={'refresh-button'}>
                    <Ionicons
                        name={isRefreshing ? "sync" : "refresh"}
                        size={24}
                        color={isRefreshing ? theme.colors.gray : theme.colors.dark}
                    />
                </TouchableOpacity>
            </View>
            <RNCalendar
                current={getLocalDate()}
                markedDates={markedDates}
                onDayPress={(day) => setSelectedDate(day.dateString)}
                theme={{
                    selectedDayBackgroundColor: theme.colors.primary,
                    todayTextColor: theme.colors.primary,
                    arrowColor: theme.colors.primary,
                }}
            />
            <View style={styles.eventsContainer}>
                <Text style={styles.dateHeader}>
                    {formattedSelectedDate}
                </Text>
                {allItems.length > 0 ? (
                    allItems.map((item, index) => (
                        <TouchableOpacity
                            key={item.id || index}
                            style={[
                                styles.eventCard,
                                {
                                    borderLeftWidth: 4,
                                    borderLeftColor: item.itemType === 'task' ? theme.colors.secondary : theme.colors.primary
                                }
                            ]}
                            onPress={() => handleEventPress(item)}
                        >
                            <View style={styles.eventTimeContainer}>
                                <Text style={styles.eventTime}>
                                    {item.allDayEvent ? 'All day' :
                                        item.start?.dateTime ?
                                            new Date(item.start.dateTime).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }) : 'All day'}
                                </Text>
                            </View>
                            <View style={styles.eventDetails}>
                                <Text style={styles.eventTitle}>
                                    {item.itemType === 'task' ? '📝 ' : '📅 '}{item.summary}
                                </Text>
                                {item.location && (
                                    <Text style={styles.eventLocation}>{item.location}</Text>
                                )}
                                {item.description && (
                                    <Text style={styles.eventDescription}>{item.description}</Text>
                                )}
                            </View>
                            {activeEvent?.id === item.id && (
                                item.location ? (
                                    <TouchableOpacity
                                        style={styles.directionButton}
                                        onPress={() => handleGetDirections(item)}
                                        testID={'get-directions-button'}
                                    >
                                        <Ionicons name="navigate-circle" size={22} color={theme.colors.white}/>
                                        <Text style={styles.directionButtonText}>Get Directions</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <Text style={styles.noLocationText}>No location for this event</Text>
                                )
                            )}
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.noEventsContainer}>
                        <Text style={styles.noEventsText}>No events or tasks scheduled for this day</Text>
                    </View>
                )}
            </View>
        </View>
    );
};
Calendar.propTypes = {
    events: PropTypes.any
}
const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 10,
        overflow: 'hidden',
        marginHorizontal: hp(2),
        marginBottom: hp(2),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: hp(2),
    },
    headerTitle: {
        fontSize: hp(2.2),
        fontWeight: 'bold',
        color: theme.colors.dark,
    },
    eventsContainer: {
        padding: hp(2),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray,
    },
    dateHeader: {
        fontSize: hp(2),
        fontWeight: 'bold',
        color: theme.colors.dark,
        marginBottom: hp(2),
    },
    eventCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: hp(2),
        borderRadius: 10,
        marginBottom: hp(1.5),
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    eventTimeContainer: {
        width: hp(8),
        marginRight: hp(2),
    },
    eventTime: {
        fontSize: hp(1.6),
        color: theme.colors.dark,
        opacity: 0.8,
    },
    eventDetails: {
        flex: 1,
    },
    eventTitle: {
        fontSize: hp(1.8),
        fontWeight: '500',
        color: theme.colors.dark,
        marginBottom: hp(0.5),
    },
    eventLocation: {
        fontSize: hp(1.6),
        color: theme.colors.dark,
        opacity: 0.7,
    },
    directionButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: hp(1),
        paddingHorizontal: hp(2),
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: hp(2),
    },
    directionButtonText: {
        color: theme.colors.white,
        marginLeft: hp(1),
        fontSize: hp(1.6),
    },
    noEventsContainer: {
        alignItems: 'center',
        paddingVertical: hp(2),
    },
    noEventsText: {
        fontSize: hp(1.6),
        color: theme.colors.grayDark,
    },
    eventDescription: {
        fontSize: hp(1.4),
        color: theme.colors.dark,
        opacity: 0.6,
        marginTop: hp(0.5),
    },
    noLocationText: {
        fontSize: hp(1.6),
        color: 'gray',
        alignSelf: 'flex-start',
        marginTop: hp(1),
        marginLeft: hp(2),
    },

});

export default Calendar;
