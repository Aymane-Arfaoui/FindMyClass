import React, {useContext, useEffect, useMemo, useState} from 'react';
import {SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import AppNavigationPanel from '@/components/AppNavigationPannel';
import WeekNavigation from '@/components/WeekNavigation';
import EventList, {getLocalDateString} from '@/components/EventList';
import CreateTask from '@/components/CreateTask';
import SmartPlannerHeader from "@/components/SmartPlannerHeader";
import {ThemeContext} from '@/context/ThemeProvider'
import {StatusBar} from "expo-status-bar";
import {getEventsAndTasks} from './services/fetchSmartPlanner';

const CalendarFilter = ({
                            availableCalendars,
                            selectedCalendars,
                            onToggleCalendar,
                            setSelectedCalendars,
                            setIsVisible,
                            styles,
                            theme
                        }) => {
    return (
        <View style={styles.calendarFilter}>
            <View style={styles.calendarFilterHeader}>
                <Text style={styles.calendarFilterTitle}>Calendars</Text>
                <View style={styles.calendarFilterActions}>
                    <TouchableOpacity onPress={() =>
                        setSelectedCalendars(availableCalendars.reduce((acc, cal) => ({...acc, [cal]: true}), {}))
                    }>
                        <Text style={styles.calendarFilterActionText}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() =>
                        setSelectedCalendars(availableCalendars.reduce((acc, cal) => ({...acc, [cal]: false}), {}))
                    }>
                        <Text style={styles.calendarFilterActionText}>None</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsVisible(false)}>
                        <Ionicons name="close" size={24} color={theme.colors.dark}/>
                    </TouchableOpacity>
                </View>
            </View>

            {availableCalendars.map(calendar => (
                <View key={calendar} style={styles.calendarFilterItem}>
                    <Text style={styles.calendarFilterText}>
                        {calendar.includes('@') ? calendar.split('@')[0] : calendar}
                    </Text>
                    <Switch
                        value={selectedCalendars[calendar] || false}
                        onValueChange={(value) => onToggleCalendar(calendar, value)}
                        trackColor={{false: '#fff', true: theme.colors.primary}}
                        thumbColor={selectedCalendars[calendar] ? '#fff' : theme.colors.darkgray}
                    />
                </View>
            ))}
        </View>
    );
};


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


    const loadEventsAndTasks = async () => {
        try {
            const result = await getEventsAndTasks(selectedDate, selectedCalendars, theme);

            if (result.initialCalendars) {
                setSelectedCalendars(result.initialCalendars);
            }

            setEvents(result.events);
            setTasks(result.tasks);
            setAvailableCalendars(result.availableCalendars);
        } catch (error) {
            console.error('Error loading events and tasks:', error);
            setEvents([]);
            setTasks([]);
            setAvailableCalendars([]);
        }
    };
    useEffect(() => {
        loadEventsAndTasks();
    }, [selectedDate, selectedCalendars]);

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
                    <TouchableOpacity testID={'filter-button'} style={styles.filterButton}
                                      onPress={() => setIsCalendarFilterVisible(!isCalendarFilterVisible)}>
                        <Ionicons name="filter" size={22} color={theme.colors.grayDark}/>
                    </TouchableOpacity>
                </View>

                {isCalendarFilterVisible &&
                    <View style={{position: 'absolute', top: 190, left: 16, right: 16}}>
                        <CalendarFilter
                            availableCalendars={availableCalendars}
                            selectedCalendars={selectedCalendars}
                            onToggleCalendar={handleCalendarToggle}
                            setSelectedCalendars={setSelectedCalendars}
                            setIsVisible={setIsCalendarFilterVisible}
                            styles={styles}
                            theme={theme}
                        />
                    </View>
                }

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
                    <TouchableOpacity testID={'cancel-route-button'} style={styles.cancelRouteButton}
                                      onPress={handleCancelRoute}>
                        <Text style={styles.cancelRouteButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity testID={'submit-route-button'} style={styles.submitRouteButton}
                                      onPress={handleSubmitRoute}>
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

