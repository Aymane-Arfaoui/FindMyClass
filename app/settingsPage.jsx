import React, {useContext, useEffect, useMemo, useState} from 'react';
import {Alert, SafeAreaView, StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {StatusBar} from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {useRouter} from 'expo-router';

import {ThemeContext} from '@/context/ThemeProvider';
import {getUserInfo} from '@/services/userService';
import {getCalendarEvents} from '@/services/calendarService';

WebBrowser.maybeCompleteAuthSession();

const Settings = () => {
    const router = useRouter();
    const [userInfo, setUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [accessibilityOption, setAccessibilityOption] = useState(false);
    const {isDark, toggleTheme, colorBlindMode, toggleColorBlindMode, theme} = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [, response, promptAsync] = Google.useAuthRequest({
        webClientId: '794159243993-1d44c4nsmehq6hrlg46qc3vrjaq0ohuu.apps.googleusercontent.com',
        iosClientId: '794159243993-frttedg6jh95qulh4eh6ff8090t4018q.apps.googleusercontent.com',
        androidClientId: '382767299119-lsn33ef80aa3s68iktbr29kpdousi4l4.apps.googleusercontent.com',
        scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
        redirectUri: 'com.aymanearfaoui.findmyclass:/oauth2redirect',
    });

    useEffect(() => {
        if (response?.type === 'success') {
            processLogin(response.authentication.accessToken);
        }
    }, [response]);

    useEffect(() => {
        const loadAccessibilityOption = async () => {
            const accessibility = await AsyncStorage.getItem("@accessibility");
            if (accessibility) setAccessibilityOption(JSON.parse(accessibility));
        };
        loadAccessibilityOption();
    }, []);

    useEffect(() => {
        const loadUser = async () => {
            const storedUser = await AsyncStorage.getItem("@user");
            if (storedUser) setUserInfo(JSON.parse(storedUser));
        };
        loadUser();
    }, []);

    const processLogin = async (accessToken) => {
        try {
            setIsLoading(true);
            const userData = await getUserInfo(accessToken);
            const events = await getCalendarEvents(accessToken);
            await AsyncStorage.setItem("@user", JSON.stringify(userData));
            await AsyncStorage.setItem("@calendar", JSON.stringify(events));
            setUserInfo(userData);
            router.replace("/user");
        } catch (error) {
            Alert.alert("Login Failed", "Could not retrieve user information.");
        } finally {
            setIsLoading(false);
        }
    };
    const toggleAccessibilityOption = async () => {
        await AsyncStorage.setItem("@accessibility",JSON.stringify(!accessibilityOption));
        setAccessibilityOption(!accessibilityOption);
    };
    const handleSignOut = async () => {
        await AsyncStorage.multiRemove(["@user", "@calendar"]);
        setUserInfo(null);
        router.replace("/Welcome");
    };

    return (
        <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
            <StatusBar style={isDark ? 'light' : 'dark'}/>

            {/* Header */}
            <View style={[styles.header, {borderBottomColor: theme.colors.cardBorder}]}>
                <TouchableOpacity  testID={'back-button'} onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={theme.colors.primary}/>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, {color: theme.colors.text}]}>Settings</Text>
            </View>

            {/* Settings List */}
            <View style={styles.settingsList}>
                <View style={[styles.settingCard, {
                    backgroundColor: theme.colors.settingsCardBackground,
                    borderColor: theme.colors.cardBorder
                }]}>
                    <Text style={[styles.settingTitle, {color: theme.colors.text}]}>Dark Mode</Text>
                    <Switch
                        testID={'dark-mode-switch'}
                        value={isDark}
                        onValueChange={toggleTheme}
                        trackColor={{false: theme.colors.gray, true: theme.colors.primary}}
                        thumbColor={isDark ? theme.colors.white : '#f4f3f4'}
                    />
                </View>

                <View style={[styles.settingCard, {
                    backgroundColor: theme.colors.settingsCardBackground,
                    borderColor: theme.colors.cardBorder
                }]}>
                    <Text style={[styles.settingTitle, {color: theme.colors.text}]}>Color Blind Mode</Text>
                    <Switch
                        testID={'color-blind-mode-switch'}
                        value={colorBlindMode}
                        onValueChange={toggleColorBlindMode}
                        trackColor={{false: theme.colors.gray, true: theme.colors.primary}}
                        thumbColor={colorBlindMode ? theme.colors.white : '#f4f3f4'}
                    />
                </View>
                <View style={[styles.settingCard, {
                    backgroundColor: theme.colors.settingsCardBackground,
                    borderColor: theme.colors.cardBorder
                }]}>
                    <Text style={[styles.settingTitle, {color: theme.colors.text}]}>Accessibility Routing</Text>
                    <Switch
                        testID={'accessibility-routing-switch'}
                        value={accessibilityOption}
                        onValueChange={toggleAccessibilityOption}
                        trackColor={{false: theme.colors.gray, true: theme.colors.primary}}
                        thumbColor={accessibilityOption ? theme.colors.white : '#f4f3f4'}
                    />
                </View>
            </View>

            {/* Sign In/Out Section */}
            <View style={styles.authContainer}>
                <Text style={styles.authStatus}>
                    {userInfo
                        ? `Signed in as ${userInfo.given_name || userInfo.email}`
                        : 'You are not signed in'}
                </Text>

                <TouchableOpacity
                    onPress={userInfo ? handleSignOut : () => promptAsync()}
                    style={[
                        styles.authButton,
                        userInfo && {backgroundColor: theme.colors.primary, borderWidth: 0},
                    ]}
                    disabled={isLoading}
                >
                    <Ionicons
                        name={userInfo ? "log-out-outline" : "log-in-outline"}
                        size={22}
                        color={theme.colors.white}
                    />
                    <Text style={[
                        styles.authButtonText,
                        userInfo && {color: theme.colors.white}
                    ]}>
                        {isLoading ? "Processing..." : userInfo ? "Sign Out" : "Sign In with Google"}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    settingsList: {
        marginTop: 20,
    },
    settingCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
    },
    settingTitle: {
        fontSize: 18,
    },
    authContainer: {
        marginTop: 'auto',
        alignItems: 'center',
        paddingVertical: 40,
    },
    authStatus: {
        fontSize: 14,
        color: theme.colors.grayDark,
        marginBottom: 10,
        textAlign: 'center',
    },
    authButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        width: '80%',
        backgroundColor: theme.colors.primary,
        borderWidth: 2,
        borderColor: theme.colors.cardBorder,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    authButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
        letterSpacing: 0.4,
        color: theme.colors.white,
    }

});

export default Settings;
