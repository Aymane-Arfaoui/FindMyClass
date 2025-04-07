import React, {useContext, useEffect, useMemo, useState} from 'react';
import {SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import {useRouter} from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Ionicons} from '@expo/vector-icons';
import AppNavigationPanel from '@/components/AppNavigationPannel';
import WeekNavigation from '@/components/WeekNavigation';
import EventList, {getLocalDateString} from '@/components/EventList';
import CreateTask from '@/components/CreateTask';
import SmartPlannerHeader from "@/components/SmartPlannerHeader";
import {ThemeContext} from '@/context/ThemeProvider'
import {StatusBar} from "expo-status-bar";


const SmartPlanner = () => {
    const router = useRouter();
    const currentDate = new Date();
    const [selectedDate, setSelectedDate] = useState(getLocalDateString(new Date()));
    const [events, setEvents] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [availableCalendars, setAvailableCalendars] = useState([]);
    const [selectedCalendars, setSelectedCalendars] = useState({});
    const [isCalendarFilterVisible, setIsCalendarFilterVisible] = useState(false);
    const [isPlanRouteMode, setIsPlanRouteMode] = useState(false);
    const [selectedRouteEvents, setSelectedRouteEvents] = useState({});
    const [resetSelectionFlag, setResetSelectionFlag] = useState(false);
    const day = currentDate.getDate();
    const weekday = currentDate.toLocaleDateString('en-US', {weekday: 'short'});
    const monthYear = currentDate.toLocaleDateString('en-US', {month: 'short', year: 'numeric'});
    const {isDark, theme} = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);

    useEffect(() => {
        loadEventsAndTasks();
    }, [selectedDate, selectedCalendars]);

    const loadEventsAndTasks = async () => {
        try {
        const storedUser = await AsyncStorage.getItem("@user");
        if (!storedUser) {
            setEvents([]);
            setTasks([]);
            return;
        }
        const storedEvents = await AsyncStorage.getItem("@calendar");
        const storedTasks = await AsyncStorage.getItem("tasks");

            if (storedEvents) {
                const parsedEvents = JSON.parse(storedEvents);
                const calendars = [...new Set(parsedEvents.map(event => event.calendarName || 'Main'))];
                setAvailableCalendars(calendars);

                if (Object.keys(selectedCalendars).length === 0) {
                    const initialCalendars = calendars.reduce((acc, cal) => ({...acc, [cal]: true}), {});
                    setSelectedCalendars(initialCalendars);
                    return;
                }

                const filteredEvents = parsedEvents.filter(event => {
                    let eventDate;
                    if (event.start?.date) {
                        eventDate = event.start.date;
                    } else {
                        eventDate = getLocalDateString(event.start?.dateTime);
                    }
                    const calendarName = event.calendarName || 'Main';
                    return eventDate === selectedDate && selectedCalendars[calendarName];
                }).map(event => ({
                    ...event,
                    itemType: 'event',
                    calendarName: event.calendarName || 'Main',
                    calendarColor: event.calendarColor || theme.colors.blueDark
                }));

                setEvents(filteredEvents);
            }

            if (storedTasks) {
                const parsedTasks = JSON.parse(storedTasks);
                const filteredTasks = parsedTasks.filter(task => {
                    const taskDate = getLocalDateString(task.date);
                    return taskDate === selectedDate;
                }).map(task => ({
                    itemType: 'task',
                    summary: task.taskName,
                    description: task.notes,
                    location: task.address,
                    start: task.allDayEvent
                        ? {date: getLocalDateString(task.date)}
                        : {dateTime: task.startTime},
                    end: task.allDayEvent
                        ? {date: getLocalDateString(task.date)}
                        : {dateTime: task.endTime},
                    allDayEvent: task.allDayEvent,
                    id: task.id
                }));

                setTasks(filteredTasks);
            }
        } catch (error) {
            console.error('Error loading events and tasks:', error);
            // Set empty in case of errors
            setEvents([]);
            setTasks([]);
            setAvailableCalendars([]);
        }
    };

    const allItems = [...events, ...tasks].sort((a, b) => {
        if (a.allDayEvent) return -1;
        if (b.allDayEvent) return 1;
        const aTime = a.start?.dateTime ? new Date(a.start.dateTime) : new Date(0);
        const bTime = b.start?.dateTime ? new Date(b.start.dateTime) : new Date(0);
        return aTime - bTime;
    });

    const handleCalendarToggle = (calendar, value) => {
        setSelectedCalendars(prev => ({...prev, [calendar]: value}));
    };

    const renderCalendarFilter = () => (
        <View style={styles.calendarFilter}>
            <View style={styles.calendarFilterHeader}>
                <Text style={styles.calendarFilterTitle}>Calendars</Text>
                <View style={styles.calendarFilterActions}>
                    <TouchableOpacity onPress={() => setSelectedCalendars(
                        availableCalendars.reduce((acc, cal) => ({...acc, [cal]: true}), {})
                    )}><Text style={styles.calendarFilterActionText}>All</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setSelectedCalendars(
                        availableCalendars.reduce((acc, cal) => ({...acc, [cal]: false}), {})
                    )}><Text style={styles.calendarFilterActionText}>None</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsCalendarFilterVisible(false)}>
                        <Ionicons name="close" size={24} color={theme.colors.dark}/>
                    </TouchableOpacity>
                </View>
            </View>

            {availableCalendars.map(calendar => (
                <View key={calendar} style={styles.calendarFilterItem}>
                    <Text
                        style={styles.calendarFilterText}>{calendar.includes('@') ? calendar.split('@')[0] : calendar}</Text>
                    <Switch
                        value={selectedCalendars[calendar] || false}
                        onValueChange={(value) => handleCalendarToggle(calendar, value)}
                        trackColor={{
                            false: '#fff',
                            true: theme.colors.primary
                        }}
                        thumbColor={selectedCalendars[calendar] ? '#fff' : theme.colors.darkgray}
                    />
                </View>
            ))}
        </View>
    );

    const handleCancelRoute = () => {
        setIsPlanRouteMode(false);
        setSelectedRouteEvents({});
        setResetSelectionFlag(prev => !prev);
    };

    const handleSubmitRoute = () => {
        if (Object.keys(selectedRouteEvents).length === 0) {
            alert("Please select at least one event with an address.");
            return;
        }

        console.log("Selected events:", selectedRouteEvents);

        // Filter tasks that have addresses and format classroom locations
        const tasksWithAddresses = Object.values(selectedRouteEvents)
            .filter(event => {
                const address = event.location;
                console.log("Checking address for event:", event.summary, "Address:", address);
                return address && address !== 'No location available';
            })
            .map(event => {
                const address = event.location;
                let formattedAddress = address;
                let isClassroom = false;

                console.log("Processing address:", address);

                // Handle JMSB room format (e.g., "Rm S2.330")
                const jmsbRoomMatch = address.match(/Rm\s+([A-Z][0-9]\.[0-9]+)/i);
                if (jmsbRoomMatch) {
                    formattedAddress = `JMSB ${jmsbRoomMatch[1]}`;
                    isClassroom = true;
                }
                // Handle MB building format
                else if (address.includes("MB Concordia University") || 
                        address.includes("John Molson School of Business") ||
                        address.includes("MB Building")) {
                    formattedAddress = "MB Building, Concordia University";
                    isClassroom = true;
                }
                // Handle H building format
                else if (address.includes("H Building") || address.includes("Hall Building")) {
                    formattedAddress = "Hall Building, Concordia University";
                    isClassroom = true;
                }
                // Handle general Concordia University addresses
                else if (address.includes("Concordia University")) {
                    formattedAddress = address;
                    isClassroom = true;
                }

                console.log("Formatted address:", formattedAddress);

                const taskData = {
                    taskName: event.summary,
                    address: formattedAddress,
                    startTime: event.start?.dateTime,
                    endTime: event.end?.dateTime,
                    isClassroom: isClassroom,
                    originalAddress: address
                };

                console.log("Task data:", taskData);
                return taskData;
            });

        console.log("Tasks with addresses:", tasksWithAddresses);

        if (tasksWithAddresses.length === 0) {
            alert("Please select tasks that have valid addresses.");
            return;
        }

        // Navigate to chat with the tasks
        router.push({
            pathname: '/chat',
            params: {
                routePlanning: true,
                tasks: JSON.stringify(tasksWithAddresses)
            }
        });

        setIsPlanRouteMode(false);
        setResetSelectionFlag(prev => !prev);
    };

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.smartPlannerHeader}}>
            <StatusBar style={isDark ? 'light' : 'dark'}/>
            <SmartPlannerHeader
                router={router}
                isPlanRouteMode={isPlanRouteMode}
                setIsPlanRouteMode={setIsPlanRouteMode}
                setIsAddModalVisible={setIsAddModalVisible}
                day={day}
                weekday={weekday}
                monthYear={monthYear}
                onBack={() => router.back()}
                onAddTask={() => setIsAddModalVisible(true)}
                onPlanRoute={() => setIsPlanRouteMode(true)}
            />

            <WeekNavigation selectedDate={selectedDate} onSelectDate={setSelectedDate}/>

            <View style={{flex: 1, backgroundColor: theme.colors.background}}>
                <View style={styles.eventTopRow}>
                    <Text style={styles.eventHeaderText}>
                        {isPlanRouteMode ? "Select" : "Time"}
                    </Text>
                    <Text style={styles.eventHeaderText}>Course</Text>
                    <TouchableOpacity style={styles.filterButton}
                                      onPress={() => setIsCalendarFilterVisible(!isCalendarFilterVisible)}>
                        <Ionicons name="filter" size={22} color={theme.colors.grayDark}/>
                    </TouchableOpacity>
                </View>

                {isCalendarFilterVisible &&
                    <View style={{position: 'absolute', top: 190, left: 16, right: 16}}>{renderCalendarFilter()}</View>}

                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <EventList
                        events={allItems}
                        onUpdate={loadEventsAndTasks}
                        isPlanRouteMode={isPlanRouteMode}
                        onSelectForRoute={setSelectedRouteEvents}
                        resetSelectionFlag={resetSelectionFlag}
                    />
                </ScrollView>
            </View>
            {isPlanRouteMode && allItems.length > 0 && (
                <View style={styles.stickyRouteActions}>
                    <TouchableOpacity style={styles.cancelRouteButton} onPress={handleCancelRoute}>
                        <Text style={styles.cancelRouteButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.submitRouteButton} onPress={handleSubmitRoute}>
                        <Text style={styles.submitRouteButtonText}>Plan Route</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!isPlanRouteMode && <AppNavigationPanel/>}

            <CreateTask
                isVisible={isAddModalVisible}
                onClose={() => setIsAddModalVisible(false)}
                onTaskCreated={(newTask) => {
                    setTasks(prev => [...prev, newTask]);
                    loadEventsAndTasks();
                }}
            />
        </SafeAreaView>
    );
};

export default SmartPlanner;

const createStyles = (theme) => StyleSheet.create({
    stickyRouteActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.backgroundNav,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        paddingBottom: 32,
        borderTopColor: theme.colors.gray,
        zIndex: 1000,
    },
    calendarFilter: {
        position: 'absolute',
        top: -150,
        right: 20,
        backgroundColor: theme.colors.cardBackground,
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
    calendarFilterActionText: {
        color: theme.colors.dark,
        fontSize: 12,
        fontWeight: '500',
        marginHorizontal: 8,
    },
    calendarFilterText: {
        fontSize: 16,
        color: theme.colors.dark,
        textTransform: 'capitalize',
    },
    submitRouteButton: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        marginLeft: 8,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cancelRouteButton: {
        flex: 1,
        backgroundColor: theme.colors.grayDark,
        paddingVertical: 16,
        marginRight: 8,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cancelRouteButtonText: {
        color: theme.colors.white,
        fontWeight: '600',
        fontSize: 16,
    },

    submitRouteButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    scrollContainer: {
        paddingBottom: 60,
    },
    eventTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 10,
        marginBottom: 4,
    },
    eventHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.grayDark,
    },
    filterButton: {
        padding: 4,
    },
});
