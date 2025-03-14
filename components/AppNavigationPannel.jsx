import * as React from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { usePathname, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { getUserInfo } from "@/services/userService";
import { getCalendarEvents } from "@/services/calendarService";

const { width } = Dimensions.get("window");

WebBrowser.maybeCompleteAuthSession();

const AppNavigationPanel = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [setUser] = React.useState(null);
    const [isLoading, setLoading] = React.useState(false);

    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: '794159243993-1d44c4nsmehq6hrlg46qc3vrjaq0ohuu.apps.googleusercontent.com',
        iosClientId: '794159243993-frttedg6jh95qulh4eh6ff8090t4018q.apps.googleusercontent.com',
        androidClientId: '382767299119-lsn33ef80aa3s68iktbr29kpdousi4l4.apps.googleusercontent.com',
        scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.readonly'],
        redirectUri: 'com.aymanearfaoui.findmyclass:/oauth2redirect',
    });

    React.useEffect(() => {
        checkUserSession();
    }, []);

    React.useEffect(() => {
        if (response?.type === "success") {
            handleGoogleSignIn(response.authentication.accessToken);
        }
    }, [response]);

    const checkUserSession = async () => {
        const storedUser = await AsyncStorage.getItem("@user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    };

    const handleGoogleSignIn = async (accessToken) => {
        try {
            setLoading(true);
            const userData = await getUserInfo(accessToken);
            if (userData) {
                await AsyncStorage.setItem("@user", JSON.stringify(userData));
                setUser(userData);

                const events = await getCalendarEvents(accessToken);
                await AsyncStorage.setItem("@calendar", JSON.stringify(events));

                router.replace("/home");
            }
        } catch (error) {
            Alert.alert("Login Failed", "Could not retrieve user information.");
        } finally {
            setLoading(false);
        }
    };

    const handleNavigation = async (route) => {
        const storedUser = await AsyncStorage.getItem("@user");
        if (storedUser) {
            router.push(route);
        } else {
            Alert.alert(
                "Sign In Required",
                "You need to sign in with Google to access this feature.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Sign In", onPress: () => promptAsync() }
                ]
            );
        }
    };

    return (
        <View style={styles.appNavigationPanel} testID={'navigation-panel'}>
            <TouchableOpacity style={styles.navButton} onPress={() => router.push("/home")} testID={'button-navigate-to-home'}>
                <Ionicons
                    name="calendar-outline"
                    size={26}
                    color={pathname === "/home" ? theme.colors.primary : theme.colors.grayDark}
                />
                <View style={pathname === "/home" ? styles.dotIndicator : null} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.navButton, styles.centerButton]} onPress={() => router.push("/homemap")} testID={'button-navigate-to-homemap'}>
                <Ionicons
                    name="home-outline"
                    size={26}
                    color={pathname === "/homemap" ? theme.colors.primary : theme.colors.grayDark}
                />
                <View style={pathname === "/homemap" ? styles.dotIndicator : null} />
            </TouchableOpacity>


            <TouchableOpacity style={styles.navButton} onPress={() => router.push("/user")} testID={'button-navigate-to-user'}>

                <Ionicons
                    name="person-outline"
                    size={26}
                    color={pathname === "/user" ? theme.colors.primary : theme.colors.grayDark}
                />
                <View style={pathname === "/user" ? styles.dotIndicator : null} />
            </TouchableOpacity>

            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    appNavigationPanel: {
        position: "absolute",
        bottom: 0,
        left: 0,
        width: width,
        height: 90,
        backgroundColor: theme.colors.background,
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        borderTopLeftRadius: theme.radius.lg,
        borderTopRightRadius: theme.radius.lg,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        paddingBottom: 20,
    },
    navButton: {
        alignItems: "center",
        flex: 1,
    },
    centerButton: {
        justifyContent: "center",
        alignItems: "center",
    },
    dotIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.primary,
        marginTop: 2,
    },
    loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
});

export default AppNavigationPanel;