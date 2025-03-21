import React, {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch} from 'react-native';
import {useRouter} from 'expo-router';
import ScreenWrapper from '../components/ScreenWrapper';
import {StatusBar} from 'expo-status-bar';
import {Ionicons} from '@expo/vector-icons';
import {theme} from '@/constants/theme';
import AppNavigationPanel from '@/components/AppNavigationPannel';
import WeekNavigation from "@/components/WeekNavigation";
import EventList from "@/components/EventList";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CreateTask from "@/components/CreateTask";

const SmartPlanner = () => {
    const router = useRouter();
    const currentDate = new Date();
    const day = currentDate.getDate();
    const weekday = currentDate.toLocaleDateString('en-US', {weekday: 'short'});
    const monthYear = currentDate.toLocaleDateString('en-US', {month: 'short', year: 'numeric'});
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [events, setEvents] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [availableCalendars, setAvailableCalendars] = useState([]);
    const [selectedCalendars, setSelectedCalendars] = useState({});
    const [isCalendarFilterVisible, setIsCalendarFilterVisible] = useState(false);

    const handleTaskCreated = (newTask) => {
        setTasks(prevTasks => [...prevTasks, newTask]);
    };

    useEffect(() => {
        loadEventsAndTasks();
    }, [selectedDate, selectedCalendars]);

    const loadEventsAndTasks = async () => {
        // Load calendar events
        const storedEvents = await AsyncStorage.getItem("@calendar");
        if (storedEvents) {
            const parsedEvents = JSON.parse(storedEvents);
            
            // Extract unique calendars
            const calendars = [...new Set(parsedEvents.map(event => event.calendarName || 'Main'))];
            setAvailableCalendars(calendars);
            
            // Initialize selected calendars if empty
            if (Object.keys(selectedCalendars).length === 0) {
                const initialSelectedCalendars = calendars.reduce((acc, cal) => {
                    acc[cal] = true;
                    return acc;
                }, {});
                setSelectedCalendars(initialSelectedCalendars);
                return; // Exit early to prevent double loading
            }

            const filteredEvents = parsedEvents.filter(event => {
                const eventDate = new Date(event.start?.dateTime || event.start?.date).toISOString().split('T')[0];
                const calendarName = event.calendarName || 'Main';
                return eventDate === selectedDate && selectedCalendars[calendarName];
            }).map(event => ({
                ...event,
                itemType: 'event',
                calendarName: event.calendarName || 'Main',
                calendarColor: event.calendarColor || '#4285F4'
            }));
            setEvents(filteredEvents);
        } else {
            console.log('No events found in AsyncStorage');
        }

        // Load tasks
        const storedTasks = await AsyncStorage.getItem("tasks");
        if (storedTasks) {
            console.log('Retrieved tasks from AsyncStorage');
            const parsedTasks = JSON.parse(storedTasks);
            console.log('Total tasks in storage:', parsedTasks.length);
            const filteredTasks = parsedTasks.filter(task => {
                const taskDate = new Date(task.date).toISOString().split('T')[0];
                return taskDate === selectedDate;
            }).map(task => ({
                itemType: 'task',
                summary: task.taskName,
                description: task.notes,
                location: task.address,
                start: { dateTime: task.allDayEvent ? null : task.startTime },
                end: { dateTime: task.allDayEvent ? null : task.endTime },
                allDayEvent: task.allDayEvent,
                id: task.id
            }));
            console.log('Tasks after filtering:', filteredTasks.map(task => ({
                summary: task.summary,
                date: task.date,
                start: task.start?.dateTime
            })));
            setTasks(filteredTasks);
        } else {
            console.log('No tasks found in AsyncStorage');
        }
    };

    // Combine and sort all items
    const allItems = [...events, ...tasks].sort((a, b) => {
        if (a.allDayEvent) return -1;
        if (b.allDayEvent) return 1;
        const aTime = a.start?.dateTime ? new Date(a.start.dateTime) : new Date(0);
        const bTime = b.start?.dateTime ? new Date(b.start.dateTime) : new Date(0);
        return aTime - bTime;
    });

    const handleCalendarToggle = (calendar, value) => {
        setSelectedCalendars(prev => ({
            ...prev,
            [calendar]: value
        }));
    };

    const CalendarFilter = () => (
        <View style={styles.calendarFilter}>
            <View style={styles.calendarFilterHeader}>
                <Text style={styles.calendarFilterTitle}>Calendars</Text>
                <View style={styles.calendarFilterActions}>
                    <TouchableOpacity 
                        style={styles.calendarFilterAction}
                        onPress={() => setSelectedCalendars(
                            availableCalendars.reduce((acc, cal) => ({ ...acc, [cal]: true }), {})
                        )}
                    >
                        <Text style={styles.calendarFilterActionText}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.calendarFilterAction}
                        onPress={() => setSelectedCalendars(
                            availableCalendars.reduce((acc, cal) => ({ ...acc, [cal]: false }), {})
                        )}
                    >
                        <Text style={styles.calendarFilterActionText}>None</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsCalendarFilterVisible(false)}>
                        <Ionicons name="close" size={24} color={theme.colors.dark} />
                    </TouchableOpacity>
                </View>
            </View>
            {availableCalendars.map((calendar) => (
                <View key={calendar} style={styles.calendarFilterItem}>
                    <Text style={styles.calendarFilterText}>
                        {calendar === 'Main' ? 'Main' : 
                         calendar.includes('@') ? 
                         calendar.split('@')[0] : 
                         calendar}
                    </Text>
                    <Switch
                        value={selectedCalendars[calendar] || false}
                        onValueChange={(value) => handleCalendarToggle(calendar, value)}
                        trackColor={{ false: theme.colors.gray, true: theme.colors.primary }}
                        thumbColor={selectedCalendars[calendar] ? theme.colors.white : theme.colors.darkGray}
                    />
                </View>
            ))}
        </View>
    );

    return (
        <ScreenWrapper>
            <StatusBar style='dark'/>
            <View style={styles.headerContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.push('/Welcome')}>
                    <Ionicons name="chevron-back" size={28} color="black"/>
                </TouchableOpacity>
                <View style={styles.dateSection}>
                    <Text style={styles.dateText}>{day}</Text>
                    <View>
                        <Text style={styles.weekdayText}>{weekday}</Text>
                        <Text style={styles.monthYearText}>{monthYear}</Text>
                    </View>
                </View>
                <View style={styles.rightActions}>
                    <TouchableOpacity 
                        style={styles.filterButton} 
                        onPress={() => setIsCalendarFilterVisible(!isCalendarFilterVisible)}
                    >
                        <Ionicons name="filter" size={24} color={theme.colors.primary}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.todayButton}>
                        <Text style={styles.todayText}>Plan Route</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addButton} onPress={() => setIsAddModalVisible(true)}>
                        <Ionicons name="add" size={28} color="white"/>
                    </TouchableOpacity>
                </View>
            </View>
            {isCalendarFilterVisible && <CalendarFilter />}
            <WeekNavigation selectedDate={selectedDate} onSelectDate={setSelectedDate}/>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <EventList events={allItems} onUpdate={loadEventsAndTasks}/>
            </ScrollView>
            <AppNavigationPanel/>
            <CreateTask 
                isVisible={isAddModalVisible} 
                onClose={() => setIsAddModalVisible(false)}
                onTaskCreated={(newTask) => {
                    handleTaskCreated(newTask);
                    loadEventsAndTasks();
                }}
            />
        </ScreenWrapper>
    );
};

export default SmartPlanner;

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        backgroundColor: '#FAF8F5',
        paddingBottom: 20,
    },
    dateSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 20,
    },
    dateText: {
        fontSize: 44,
        fontWeight: 'bold',
        color: theme.colors.dark,
        marginRight: 20,
    },
    weekdayText: {
        fontSize: 16,
        color: theme.colors.grayDark,
    },
    monthYearText: {
        fontSize: 16,
        color: theme.colors.grayDark,
        opacity: 0.7,
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    todayButton: {
        backgroundColor: theme.colors.secondary,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginRight: 20,
    },
    todayText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    addButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 50,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 1,
        left: 15,
        padding: 2,
        marginLeft: -7,
    },
    filterButton: {
        padding: 8,
        marginRight: 10,
    },
    calendarFilter: {
        position: 'absolute',
        top: 100,
        right: 20,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 1000,
        width: 280,
    },
    calendarFilterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    calendarFilterTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.dark,
    },
    calendarFilterItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray,
    },
    calendarFilterActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    calendarFilterAction: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: theme.colors.gray,
        borderRadius: 8,
    },
    calendarFilterActionText: {
        color: theme.colors.dark,
        fontSize: 12,
        fontWeight: '500',
    },
    calendarFilterText: {
        fontSize: 16,
        color: theme.colors.dark,
        textTransform: 'capitalize',
    },
});
