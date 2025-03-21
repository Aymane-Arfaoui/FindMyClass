import React, {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
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

    const handleTaskCreated = (newTask) => {
        setTasks(prevTasks => [...prevTasks, newTask]);
    };

    useEffect(() => {
        loadEventsAndTasks();
    }, [selectedDate]);

    const loadEventsAndTasks = async () => {
        // Load calendar events
        const storedEvents = await AsyncStorage.getItem("@calendar");
        if (storedEvents) {
            const parsedEvents = JSON.parse(storedEvents);
            const filteredEvents = parsedEvents.filter(event => {
                const eventDate = new Date(event.start?.dateTime || event.start?.date).toISOString().split('T')[0];
                return eventDate === selectedDate;
            }).map(event => ({...event, itemType: 'event'}));
            setEvents(filteredEvents);
        }

        // Load tasks
        const storedTasks = await AsyncStorage.getItem("tasks");
        if (storedTasks) {
            const parsedTasks = JSON.parse(storedTasks);
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
            setTasks(filteredTasks);
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
                    <TouchableOpacity style={styles.todayButton}>
                        <Text style={styles.todayText}>Plan Route</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addButton} onPress={() => setIsAddModalVisible(true)}>
                        <Ionicons name="add" size={28} color="white"/>
                    </TouchableOpacity>
                    <CreateTask 
                        isVisible={isAddModalVisible} 
                        onClose={() => setIsAddModalVisible(false)}
                        onTaskCreated={(newTask) => {
                            handleTaskCreated(newTask);
                            loadEventsAndTasks(); // Reload all items after creating a task
                        }}
                    />
                </View>
            </View>
            <WeekNavigation selectedDate={selectedDate} onSelectDate={setSelectedDate}/>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <EventList events={allItems} onUpdate={loadEventsAndTasks}/>
            </ScrollView>
            <AppNavigationPanel/>
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
});
