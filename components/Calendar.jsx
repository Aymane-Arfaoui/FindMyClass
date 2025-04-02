import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { theme } from '@/constants/theme';
import { hp } from '@/helpers/common';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchBuildingCoordinates } from "@/services/buildingService";
import { calendarService } from '@/services/calendarService';
import PropTypes from "prop-types";

const deduplicateEvents = (events) => {
    const seen = new Set();
    return events.filter((event) => {
        const key = `${event.id}_${event.calendarName}_${event.start?.dateTime || event.start?.date}_${event.iCalUID || ''}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
};

const generateUniqueKey = (item, index) => {
    if (item.itemType === 'task') {
        return `task_${item.id || index}_${item.start?.dateTime || item.start?.date || index}`;
    }
    const recurrenceId = item.recurringEventId ? `_recurrence_${item.recurringEventId}` : '';
    return `event_${item.id}${recurrenceId}_${item.calendarName || 'primary'}_${item.start?.dateTime || item.start?.date}_${item.iCalUID || index}`;
};

const Calendar = ({ events: propEvents }) => {
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [selectedDate, setSelectedDate] = useState(getLocalDate());
    const [activeEvent, setActiveEvent] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const updateEvents = useCallback((newEvents) => {
        setEvents(deduplicateEvents(newEvents));
        setIsRefreshing(false);
    }, []);

    useEffect(() => {
        calendarService.addListener(updateEvents);
        loadTasks();

        const fetchEventsOnMount = async () => {
            const storedEvents = await AsyncStorage.getItem("@calendar");
            if (storedEvents) {
                setEvents(deduplicateEvents(JSON.parse(storedEvents)));
            }
            const token = await AsyncStorage.getItem("@accessToken");
            if (token) {
                await calendarService.fetchAndUpdateEvents(token);
            }
            if (propEvents && propEvents.length > 0) {
                setEvents((prev) => deduplicateEvents([...prev, ...propEvents]));
            }
        };
        fetchEventsOnMount();

        return () => {
            calendarService.removeListener(updateEvents);
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
                setTasks(JSON.parse(tasksJson));
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        const token = await AsyncStorage.getItem("@accessToken");
        if (token) {
            await calendarService.fetchAndUpdateEvents(token);
        } else {
            setIsRefreshing(false);
            console.warn("No access token found. Please sign in again.");
        }
    };

    const markedDates = [...events, ...tasks.map(task => ({
        start: { dateTime: task.date },
        type: 'task'
    }))].reduce((acc, item) => {
        const eventDate = item.start?.dateTime
            ? formatDateToLocalDate(item.start.dateTime)
            : item.start?.date;
        if (eventDate) {
            acc[eventDate] = {
                marked: true,
                dotColor: item.type === 'task' ? theme.colors.secondary : (item.calendarColor || theme.colors.primary),
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

    const allItems = [
        ...events.map(event => ({ ...event, itemType: 'event' })),
        ...tasks.map(task => ({
            itemType: 'task',
            summary: task.taskName,
            location: task.address,
            description: task.notes,
            start: { dateTime: task.allDayEvent ? null : task.startTime },
            end: { dateTime: task.allDayEvent ? null : task.endTime },
            allDayEvent: task.allDayEvent,
            id: task.id
        }))
    ].filter(item => {
        const itemDate = item.start?.dateTime
            ? formatDateToLocalDate(item.start.dateTime)
            : item.start?.date;
        return itemDate === selectedDate;
    }).sort((a, b) => {
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

    const handleGetDirections = async (item) => {
        if (!item.location) {
            console.warn("No location available for this item.");
            return;
        }

        try {
            const coordinates = await fetchBuildingCoordinates(item.location);
            const roomNumber = item.location.split('Rm')[1]?.trim();

            if (coordinates) {
                router.push(`/homemap?lat=${coordinates.latitude}&lng=${coordinates.longitude}&room=${roomNumber}`);
            } else {
                console.error("Failed to fetch building coordinates.");
            }
        } catch (error) {
            console.error('Error fetching building coordinates:', error);
        }
    };

    const handleEventPress = (item) => {
        setActiveEvent(activeEvent?.id === item.id ? null : item);
    };

    return (
        <View style={styles.container} testID={'calendar'}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.dark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Calendar</Text>
                <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing}>
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
                            key={generateUniqueKey(item, index)}
                            style={[
                                styles.eventCard,
                                { borderLeftWidth: 4, borderLeftColor: item.itemType === 'task' ? theme.colors.secondary : (item.calendarColor || theme.colors.primary) }
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
                                    {item.calendarName && ` (${item.calendarName})`}
                                </Text>
                                {item.location && (
                                    <Text style={styles.eventLocation}>{item.location}</Text>
                                )}
                                {item.description && (
                                    <Text style={styles.eventDescription}>{item.description}</Text>
                                )}
                            </View>
                            {activeEvent?.id === item.id && item.location && (
                                <TouchableOpacity
                                    style={styles.directionButton}
                                    onPress={() => handleGetDirections(item)}
                                >
                                    <Ionicons name="navigate-circle" size={22} color={theme.colors.white} />
                                    <Text style={styles.directionButtonText}>Get Directions</Text>
                                </TouchableOpacity>
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
    events: PropTypes.array
};

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
        shadowOffset: { width: 0, height: 1 },
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
});

export default Calendar;