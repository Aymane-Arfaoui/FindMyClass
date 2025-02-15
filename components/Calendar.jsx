import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { theme } from '../constants/theme';
import { hp } from '../helpers/common';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const Calendar = ({ events: propEvents }) => {
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(getLocalDate());

    useEffect(() => {
        loadEvents();
    }, [propEvents]);

    useFocusEffect(
        useCallback(() => {
            loadEvents();
        }, [])
    );

    function getLocalDate() {
        return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    }

    const loadEvents = async () => {
        if (propEvents && propEvents.length > 0) {
            setEvents(propEvents);
        } else {
            const storedEvents = await AsyncStorage.getItem("@calendar");
            if (storedEvents) {
                setEvents(JSON.parse(storedEvents));
            }
        }
    };

    const markedDates = events.reduce((acc, event) => {
        const eventDate = event.start?.dateTime
            ? new Date(event.start.dateTime).toLocaleDateString('en-CA')
            : event.start?.date;

        if (eventDate) {
            acc[eventDate] = {
                marked: true,
                dotColor: theme.colors.primary,
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

    const selectedDateEvents = events.filter(event => {
        const eventDate = event.start?.dateTime
            ? new Date(event.start.dateTime).toLocaleDateString('en-CA')
            : event.start?.date;

        return eventDate === selectedDate;
    });

    const formattedSelectedDate = new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }).format(new Date(selectedDate + 'T00:00:00'));

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.dark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Calendar</Text>
                <View style={{ width: 24 }} />
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
                {selectedDateEvents.length > 0 ? (
                    selectedDateEvents.map((event, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.eventCard}
                            onPress={() => handleEventPress(event)}
                        >
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
                        </TouchableOpacity>
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

const handleEventPress = (event) => {
    alert(`Get directions to: ${event.location}`);
    // need to add logic here soon
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
