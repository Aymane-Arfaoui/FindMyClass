import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { theme } from '../constants/theme';
import { hp } from '../helpers/common';

const Calendar = ({ events }) => {
    // Format events for the calendar
    const markedDates = events.reduce((acc, event) => {
        const date = new Date(event.start?.dateTime || event.start?.date)
            .toISOString()
            .split('T')[0];

        acc[date] = {
            marked: true,
            dotColor: theme.colors.primary,
            selected: true,
            selectedColor: theme.colors.lightPrimary,
            events: [...(acc[date]?.events || []), event],
        };
        return acc;
    }, {});

    return (
        <View style={styles.container} testID={'calendar'}>
            <RNCalendar
                markedDates={markedDates}
                theme={{
                    selectedDayBackgroundColor: theme.colors.primary,
                    todayTextColor: theme.colors.primary,
                    arrowColor: theme.colors.primary,
                }}
            />
            <View style={styles.eventList}>
                {Object.entries(markedDates).map(([date, data]) => (
                    <View key={date} style={styles.dateSection}>
                        <Text style={styles.dateText}>
                            {new Date(date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </Text>
                        {data.events.map((event, index) => (
                            <View key={index} style={styles.eventItem}>
                                <Text style={styles.eventTime}>
                                    {event.start?.dateTime ?
                                        new Date(event.start.dateTime).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        }) : 'All day'
                                    }
                                </Text>
                                <Text style={styles.eventTitle}>{event.summary}</Text>
                            </View>
                        ))}
                    </View>
                ))}
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
    eventList: {
        padding: hp(2),
    },
    dateSection: {
        marginBottom: hp(2),
    },
    dateText: {
        fontSize: hp(2),
        fontWeight: 'bold',
        color: theme.colors.dark,
        marginBottom: hp(1),
    },
    eventItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp(1),
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.lightGray,
    },
    eventTime: {
        width: hp(8),
        fontSize: hp(1.6),
        color: theme.colors.gray,
        marginRight: hp(1),
    },
    eventTitle: {
        flex: 1,
        fontSize: hp(1.8),
        color: theme.colors.dark,
    },
});

export default Calendar;