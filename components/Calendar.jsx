import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { theme } from '../constants/theme';
import { hp } from '../helpers/common';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Calendar = ({ events: propEvents }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [events, setEvents] = useState([]);
    const router = useRouter();

    useEffect(() => {
        if (propEvents && propEvents.length > 0) {
            setEvents(propEvents);
        } else {
            loadEventsFromStorage();
        }
    }, [propEvents]);

    const loadEventsFromStorage = async () => {
        const storedEvents = await AsyncStorage.getItem("@calendar");
        if (storedEvents) {
            setEvents(JSON.parse(storedEvents));
        }
    };

    // Marked dates logic
    const markedDates = events.reduce((acc, event) => {
        const date = new Date(event.start?.dateTime || event.start?.date)
            .toISOString()
            .split('T')[0];

        acc[date] = {
            marked: true,
            dotColor: theme.colors.primary,
            selected: date === selectedDate,
            selectedColor: theme.colors.lightPrimary,
        };
        return acc;
    }, {});

    const selectedDateEvents = events.filter(event => {
        const eventDate = new Date(event.start?.dateTime || event.start?.date)
            .toISOString()
            .split('T')[0];
        return eventDate === selectedDate;
    });

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.dark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Calendar</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Calendar */}
            <RNCalendar
                markedDates={markedDates}
                onDayPress={(day) => setSelectedDate(day.dateString)}
                theme={{
                    selectedDayBackgroundColor: theme.colors.primary,
                    todayTextColor: theme.colors.primary,
                    arrowColor: theme.colors.primary,
                }}
            />

            {/* Events for selected date */}
            <View style={styles.eventsContainer}>
                <Text style={styles.dateHeader}>
                    {new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </Text>
                {selectedDateEvents.length > 0 ? (
                    selectedDateEvents.map((event, index) => (
                        <View key={index} style={styles.eventCard}>
                            <View style={styles.eventTimeContainer}>
                                <Text style={styles.eventTime}>
                                    {event.start?.dateTime
                                        ? new Date(event.start.dateTime).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })
                                        : 'All day'}
                                </Text>
                            </View>
                            <View style={styles.eventDetails}>
                                <Text style={styles.eventTitle}>{event.summary}</Text>
                                {event.location && (
                                    <Text style={styles.eventLocation}>{event.location}</Text>
                                )}
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.noEventsContainer}>
                        <Text style={styles.noEventsText}>No events scheduled for this day</Text>
                    </View>
                )}
            </View>
        </View>
    );
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
        borderBottomColor: theme.colors.lightGray,
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
    noEventsContainer: {
        padding: hp(3),
        alignItems: 'center',
    },
    noEventsText: {
        fontSize: hp(1.8),
        color: theme.colors.dark,
        opacity: 0.7,
    },
});

export default Calendar;
