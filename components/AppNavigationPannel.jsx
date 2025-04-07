import * as React from "react";
import {Dimensions, StyleSheet, TouchableOpacity, View, Text, Animated} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {usePathname, useRouter} from "expo-router";
import {ThemeContext} from '@/context/ThemeProvider';
import {useMemo, useRef, useEffect} from "react";

const {width} = Dimensions.get("window");

const AppNavigationPanel = () => {
    const router = useRouter();
    const pathname = usePathname();
    const {theme} = React.useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);

    const getScaleForPath = (currentPath, targetPath) => (
        new Animated.Value(currentPath === targetPath ? 1.1 : 1)
    );

    // Animation values for each tab
    const calendarScale = useRef(getScaleForPath(pathname, "/home")).current;
    const mapScale = useRef(getScaleForPath(pathname, "/homemap")).current;
    const profileScale = useRef(getScaleForPath(pathname, "/user")).current;

    
    // Animate active tab when pathname changes
    useEffect(() => {
        // Reset all animations
        Animated.parallel([
            Animated.spring(calendarScale, {toValue: 1, friction: 5, useNativeDriver: true}),
            Animated.spring(mapScale, {toValue: 1, friction: 5, useNativeDriver: true}),
            // Animated.spring(plannerScale, {toValue: 1, friction: 5, useNativeDriver: true}),
            // Animated.spring(chatScale, {toValue: 1, friction: 5, useNativeDriver: true}),
            Animated.spring(profileScale, {toValue: 1, friction: 5, useNativeDriver: true}),
        ]).start();
        
        // Animate active tab
        let activeScale;
        switch (pathname) {
            case "/smartPlanner": activeScale = calendarScale; break;
            case "/homemap": activeScale = mapScale; break;
            // case "/smartPlanner": activeScale = plannerScale; break;
            // case "/chat": activeScale = chatScale; break;
            case "/user": activeScale = profileScale; break;
        }
        
        if (activeScale) {
            Animated.spring(activeScale, {
                toValue: 1.1,
                friction: 5,
                useNativeDriver: true
            }).start();
        }
    }, [pathname]);

    return (
        <View style={styles.appNavigationPanel} testID={'navigation-panel'}>
            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => router.push("/smartPlanner")}
                testID={'button-navigate-to-home'}
                activeOpacity={0.7}
            >
                <Animated.View style={{transform: [{scale: calendarScale}]}}>
                    <Ionicons
                        name={pathname === "/smartPlanner" ? "calendar" : "calendar-outline"}
                        size={26}
                        color={pathname === "/smartPlanner" ? theme.colors.primary : theme.colors.grayDark}
                    />
                </Animated.View>
                <Text style={[
                    styles.tabText,
                    pathname === "/home" && styles.activeTabText
                ]}>Calendar</Text>
                {pathname === "/home" && <View style={styles.dotIndicator}/>}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => router.push("/homemap")}
                testID={'button-navigate-to-map'}
                activeOpacity={0.7}
            >
                <Animated.View style={{transform: [{scale: mapScale}]}}>
                    <Ionicons
                        name={pathname === "/homemap" ? "map" : "map-outline"}
                        size={26}
                        color={pathname === "/homemap" ? theme.colors.primary : theme.colors.grayDark}
                    />
                </Animated.View>
                <Text style={[
                    styles.tabText,
                    pathname === "/homemap" && styles.activeTabText
                ]}>Map</Text>
                {pathname === "/homemap" && <View style={styles.dotIndicator}/>}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.tabItem}
                onPress={() => router.push("/user")}
                testID={'button-navigate-to-user'}
                activeOpacity={0.7}
            >
                <Animated.View style={{transform: [{scale: profileScale}]}}>
                    <Ionicons
                        name={pathname === "/user" ? "person" : "person-outline"}
                        size={26}
                        color={pathname === "/user" ? theme.colors.primary : theme.colors.grayDark}
                    />
                </Animated.View>
                <Text style={[
                    styles.tabText,
                    pathname === "/user" && styles.activeTabText
                ]}>Profile</Text>
                {pathname === "/user" && <View style={styles.dotIndicator}/>}
            </TouchableOpacity>
        </View>
    );
};

const createStyles = (theme) => StyleSheet.create({
    appNavigationPanel: {
        position: "absolute",
        bottom: 0,
        left: 0,
        width: width,
        height: 87,
        backgroundColor: theme.colors.backgroundNav,
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 8,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 5,
    },
    tabItem: {
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        paddingVertical: 8,
    },
    tabText: {
        fontSize: 12,
        color: theme.colors.grayDark,
        marginTop: 4,
        fontWeight: '500',
    },
    activeTabText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    dotIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.primary,
        marginTop: 3,
    },
});

export default AppNavigationPanel;
