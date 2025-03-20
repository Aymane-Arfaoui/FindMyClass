import React, {useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {theme} from '@/constants/theme';

const WeekNavigation = ({onSelectDate}) => {
    const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]);

    const generateWeekDays = () => {
        const today = new Date();
        return Array.from({length: 6}, (_, i) => {
            const day = new Date();
            day.setDate(today.getDate() + i);
            return {
                date: day.toISOString().split('T')[0],
                label: day.toLocaleDateString('en-US', {weekday: 'short'}),
                number: day.getDate()
            };
        });
    };


    const weekDays = generateWeekDays();

    return (
        <View style={styles.wrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.container}
            >
                {weekDays.map((day) => (
                    <TouchableOpacity
                        key={day.date}
                        style={[styles.dayButton, selectedDay === day.date && styles.selectedDay]}
                        onPress={() => {
                            setSelectedDay(day.date);
                            onSelectDate(day.date);
                        }}
                    >
                        <Text style={[styles.dayLabel, selectedDay === day.date && styles.selectedText]}>
                            {day.label}
                        </Text>
                        <Text style={[styles.dayNumber, selectedDay === day.date && styles.selectedText]}>
                            {day.number}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

export default WeekNavigation;

const styles = StyleSheet.create({
    wrapper: {
        marginTop: -10,
        paddingBottom: 5,
        backgroundColor: '#FAF8F5'
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    dayButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginHorizontal: 5,
    },
    selectedDay: {
        backgroundColor: theme.colors.primary,
    },
    dayLabel: {
        fontSize: 14,
        color: theme.colors.dark,
    },
    dayNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.dark,
    },
    selectedText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});
