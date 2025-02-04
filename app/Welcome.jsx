import {StyleSheet, Text, View} from 'react-native'
import React from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import {StatusBar} from 'expo-status-bar'
import Button from '../components/Button'
import {theme} from '../constants/theme'
import {hp} from '../helpers/common'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {getUserInfo} from '../services/userService'
import {getCalendarEvents} from '../services/calendarService'
import {useRouter} from 'expo-router'


WebBrowser.maybeCompleteAuthSession()

const Welcome = () => {
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: '794159243993-1d44c4nsmehq6hrlg46qc3vrjaq0ohuu.apps.googleusercontent.com',
        iosClientId: '794159243993-frttedg6jh95qulh4eh6ff8090t4018q.apps.googleusercontent.com',
        androidClientId: '794159243993-iafmbeen4qjbe6tsmba1khj7qlsrrd1a.apps.googleusercontent.com',
        scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.readonly']
    });

    const router = useRouter();

    React.useEffect(() => {
        handleSignInWithGoogle();
    }, [response])

    async function handleSignInWithGoogle() {
        if (response?.type === "success") {
            const userData = await getUserInfo(response.authentication.accessToken);
            if (userData) {
                const events = await getCalendarEvents(response.authentication.accessToken);
                await AsyncStorage.setItem("@calendar", JSON.stringify(events));
                router.replace("/home");
            }
        }
    }

    return (
        <ScreenWrapper>
            <StatusBar style='dark'/>
            <View style={styles.container}>
                <View style={styles.contentContainer}>
                    <Text style={styles.title}>Welcome to</Text>
                    <Text style={styles.appName}>FindMyClass</Text>
                </View>

                <View style={styles.buttonContainer}>
                    <Button
                        title="Sign In With Google"
                        onPress={() => promptAsync()}
                        buttonStyle={styles.button}
                    />
                    <Button
                        title="Go to Map"
                        onPress={() => router.push("/homemap")}
                        buttonStyle={styles.button}
                    />
                </View>
            </View>
        </ScreenWrapper>
    )
}

export default Welcome

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    contentContainerStyle: {
        paddingVertical: hp(4),
    },
    contentContainer: {
        alignItems: 'center',
        marginBottom: hp(2),
    },
    title: {
        fontSize: hp(3),
        color: theme.colors.dark,
        marginBottom: hp(1),
    },
    appName: {
        fontSize: hp(4),
        fontWeight: 'bold',
        color: theme.colors.dark,
    },
    buttonContainer: {
        width: '100%',
    },
    button: {
        width: '100%',
    },
    calendarContainer: {
        marginVertical: hp(2),
        padding: hp(2),
    },
    sectionTitle: {
        fontSize: hp(2.5),
        fontWeight: 'bold',
        marginBottom: hp(2),
        color: theme.colors.dark,
    },
    eventCard: {
        backgroundColor: theme.colors.white,
        padding: hp(2),
        borderRadius: 10,
        marginBottom: hp(1),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    eventTitle: {
        fontSize: hp(2),
        fontWeight: '600',
        color: theme.colors.dark,
    },
    eventTime: {
        fontSize: hp(1.8),
        color: theme.colors.black,
        marginTop: hp(0.5),
    },
    userCard: {
        backgroundColor: theme.colors.white,
        padding: hp(2),
        marginHorizontal: hp(2),
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    userImage: {
        width: hp(6),
        height: hp(6),
        borderRadius: hp(3),
        marginRight: hp(2),
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: hp(2.2),
        fontWeight: 'bold',
        color: theme.colors.dark,
        marginBottom: hp(0.5),
    },
    userEmail: {
        fontSize: hp(1.8),
        color: theme.colors.black,
    },
});