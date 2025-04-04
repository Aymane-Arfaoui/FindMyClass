import {
    ActivityIndicator,
    Alert,
    Image,
    ImageBackground,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import React, {useContext, useEffect, useMemo, useState} from 'react';
import {hp, wp} from '@/helpers/common';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import AppNavigationPanel from '@/components/AppNavigationPannel';
import UserProfileIcon from '../assets/images/profile_icon.png';
import LightBackgroundImg from '../assets/images/background-generic-1.png';
import DarkBackgroundImg from '../assets/images/BackgroundDark.png';
import {ThemeContext} from '@/context/ThemeProvider';
import {StatusBar} from "expo-status-bar";
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {getUserInfo} from "@/services/userService";
import {calendarService} from '@/services/calendarService';


WebBrowser.maybeCompleteAuthSession();

const User = () => {
    const router = useRouter();
    const [userInfo, setUserInfo] = useState(null);
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const {isDark, theme} = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);
    const [redirectToCalendar, setRedirectToCalendar] = useState(false);

    const [, response, promptAsync] = Google.useAuthRequest({
        iosClientId: '794159243993-frttedg6jh95qulh4eh6ff8090t4018q.apps.googleusercontent.com',
        androidClientId: '449179918461-habdo22us8rjk9mc8si9mpgulhec5iao.apps.googleusercontent.com',
        scopes: [
            'profile',
            'email',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.readonly',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/calendar.events.readonly',
            'https://www.googleapis.com/auth/calendar.settings.readonly',
            'https://www.googleapis.com/auth/calendar.calendarlist.readonly'
        ],
        redirectUri: 'com.aymanearfaoui.findmyclass:/oauth2redirect'
    });

    useEffect(() => {
        const fetchUserAndEvents = async () => {
            const user = await AsyncStorage.getItem('@user');
            const events = await AsyncStorage.getItem('@calendar');

            if (user) setUserInfo(JSON.parse(user));
            if (events) setCalendarEvents(JSON.parse(events));

            setLoading(false);
        };

        fetchUserAndEvents();
    }, []);


    React.useEffect(() => {
        if (response?.type === "success") {
            handleGoogleSignIn(response.authentication.accessToken);
        }
    }, [response]);

    const todayEvents = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return calendarEvents.filter(event => {
            const eventDate = new Date(event.start?.dateTime || event.start?.date).toISOString().split('T')[0];
            return eventDate === today;
        });
    }, [calendarEvents]);

    const handleGoogleSignIn = async (accessToken) => {
        try {
            setLoading(true);
            const userData = await getUserInfo(accessToken);
            if (userData) {
                await AsyncStorage.setItem("@user", JSON.stringify(userData));
                await AsyncStorage.setItem("@accessToken", accessToken);
                setUserInfo(userData);

                try {
                    const events = await calendarService.fetchAndUpdateEvents(accessToken);
                    await AsyncStorage.setItem("@calendar", JSON.stringify(events));
                    setCalendarEvents(events);
                    if (redirectToCalendar) {
                        setRedirectToCalendar(false);
                        router.push('/home');
                    }
                } catch (calendarError) {
                    console.error('Calendar sync error:', calendarError);
                    // Continue even if calendar sync fails
                }
            }
        } catch (error) {
            console.error('Sign in error:', error);
            Alert.alert("Login Failed", "Could not retrieve user information.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <SafeAreaView style={{flex: 1, backgroundColor: isDark ? '#757575' : '#FAF8F5'}}>
            <StatusBar style={isDark ? 'light' : 'dark'}/>
            <View style={{flex: 1}}>

                <ImageBackground
                    testID={'welcome-background-image'}
                    source={isDark ? DarkBackgroundImg : LightBackgroundImg}
                    style={styles.backgroundImage}
                />
                <ScrollView contentContainerStyle={[styles.container, {minHeight: '100%'}]}>

                    <View style={styles.header}>
                        <View style={styles.profileContainer}>
                            {userInfo?.picture ? (
                                <Image source={{uri: userInfo.picture}} style={styles.profileIcon}/>
                            ) : (
                                <Image source={UserProfileIcon} style={styles.profileIcon}/>
                            )}
                            <View style={styles.textContainer}>
                                <Text style={styles.welcomeText}>Welcome back</Text>
                                <Text style={styles.userName}>{userInfo?.given_name || 'Guest'}</Text>
                            </View>
                        </View>
                        <TouchableOpacity testID={'settings-button'} onPress={() => router.push('/settingsPage')}>
                            <Ionicons name="settings-sharp" size={30} color={theme.colors.settingColor}/>
                        </TouchableOpacity>
                    </View>

                    {/* Calendar Block (Home style) */}
                    <View style={styles.calendarBlock}>
                        <TouchableOpacity
                            onPress={async () => {
                                const storedUser = await AsyncStorage.getItem('@user');
                                if (!storedUser) {
                                    setRedirectToCalendar(true); // <--- this sets the intent
                                    Alert.alert("Google Sign-In Required", "Please sign in to access your calendar.", [
                                        {text: "Cancel", style: "cancel"},
                                        {text: "Sign In", onPress: () => promptAsync()}
                                    ]);
                                } else {
                                    router.push('/home');
                                }
                            }}
                            testID={'calendar-button'}
                        >
                            <View style={styles.actionIconContainer}>
                                <Ionicons name="calendar" size={24} color={theme.colors.primary}/>
                            </View>
                            <Text style={styles.blockTitle}>Calendar</Text>
                            <Text style={styles.scheduleText}>{todayEvents.length} events today</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Today's Schedule */}
                    <View style={styles.scheduleBlock}>
                        <View style={styles.scheduleHeader}>
                            <Text style={styles.blockTitle}>Today's Schedule</Text>
                            <TouchableOpacity>
                                <Text style={styles.seeAllText} onPress={() => router.push('/smartPlanner')}>See
                                    All</Text>
                            </TouchableOpacity>
                        </View>

                        {todayEvents.length > 0 ? (
                            todayEvents.map((event, index) => (
                                <View key={index} style={styles.scheduleItem}>
                                    <View style={styles.eventRow}>
                                        <Text style={styles.scheduleTime}>
                                            {event.start?.dateTime
                                                ? new Date(event.start.dateTime).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })
                                                : 'All day'}
                                        </Text>
                                        <Text style={styles.scheduleSubject}>{event.summary}</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noEventsText}>No events today</Text>
                        )}
                    </View>

                </ScrollView>
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={theme.colors.primary}/>
                    </View>
                )}
            </View>

            <AppNavigationPanel/>
        </SafeAreaView>
    );
};


const createStyles = (theme) =>
    StyleSheet.create({
        container: {
            paddingHorizontal: 20,
            paddingBottom: 120, // space for bottom nav
        },

        backgroundImage: {
            flex: 1,
            width: wp(100),
            height: hp(100),
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
            resizeMode: 'cover',
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            paddingTop: 25,
            paddingBottom: 20,
        },
        profileContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
        },
        textContainer: {
            flexDirection: 'column',
            marginLeft: 5,
            alignItems: 'flex-start'
        },
        profileIcon: {
            width: wp(14),
            height: wp(14),
            borderRadius: wp(7),
            resizeMode: 'cover',
        },
        settingsIcon: {
            width: 30,
            height: 30,
        },
        welcomeText: {
            fontSize: hp(1.8),
            color: theme.colors.dark,
            opacity: 0.7,
        },
        userName: {
            fontSize: hp(2.4),
            fontWeight: 'bold',
            color: theme.colors.dark,
        },
        calendarBlock: {
            backgroundColor: theme.colors.cardBackground,
            padding: hp(2),
            borderRadius: 15,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
            elevation: 5,
            width: '48%',
            marginTop: hp(3),
            marginBottom: hp(2),
            alignSelf: 'flex-start',
            marginLeft: wp(5),
        },
        actionIconContainer: {
            width: hp(5),
            height: hp(5),
            borderRadius: hp(2.5),
            // backgroundColor: theme.colors.primaryLight,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: hp(1),
        },
        blockTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: 10,
            color: theme.colors.text,
        },
        scheduleText: {
            fontSize: 14,
            color: theme.colors.grayDark,
        },
        scheduleBlock: {
            backgroundColor: theme.colors.cardBackground,
            padding: 15,
            marginTop: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: theme.colors.cardBorder,
            width: '90%',
        },
        scheduleHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            marginBottom: 10,
        },
        scheduleItem: {
            padding: hp(1.5),
            borderRadius: 15,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.1,
            elevation: 5,
            marginTop: hp(1.5),
            marginBottom: hp(0.1),
        },
        eventRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '90%',
        },
        scheduleTime: {
            fontSize: 14,
            color: theme.colors.grayDark,
        },
        scheduleSubject: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.colors.dark,
            // textDecorationLine: 'underline',
            width: '65%',
            flexWrap: 'wrap',
        },
        seeAllText: {
            fontSize: 14,
            color: theme.colors.primary,
            fontWeight: 'bold',
        },
        noEventsText: {
            fontSize: hp(1.8),
            color: theme.colors.grayDark,
            textAlign: 'center',
            marginTop: 10,
        },
        loadingOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.loadingoverlay,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        },
    });
export default User;