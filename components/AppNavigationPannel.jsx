import * as React from "react";
import {Dimensions, StyleSheet, TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {theme} from "@/constants/theme";
import {usePathname, useRouter} from "expo-router";

const {width, height} = Dimensions.get("window");

const AppNavigationPanel = () => {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <View style={styles.appNavigationPanel} testID={'navigation-panel'}>
            <TouchableOpacity style={styles.navButton} onPress={() => router.push("/home")} testID={'button-navigate-to-home'}>
                <Ionicons
                    name="calendar-outline"
                    size={26}
                    color={pathname === "/home" ? theme.colors.primary : theme.colors.grayDark}
                />
                <View style={pathname === "/home" ? styles.dotIndicator : null}/>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.navButton, styles.centerButton]} onPress={() => router.push("/homemap")} testID={'button-navigate-to-homemap'}>
                <Ionicons
                    name="home-outline"
                    size={26}
                    color={pathname === "/homemap" ? theme.colors.primary : theme.colors.grayDark}
                />
                <View style={pathname === "/homemap" ? styles.dotIndicator : null}/>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navButton} onPress={() => router.push("/user")} testID={'button-navigate-to-user'}>
                <Ionicons
                    name="person-outline"
                    size={26}
                    color={pathname === "/user" ? theme.colors.primary : theme.colors.grayDark}
                />
                <View style={pathname === "/user" ? styles.dotIndicator : null}/>
            </TouchableOpacity>
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
        shadowOffset: {width: 0, height: -2},
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
});

export default AppNavigationPanel;
