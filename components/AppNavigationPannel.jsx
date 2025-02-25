import * as React from "react";
import {StyleSheet, TouchableOpacity, View} from "react-native";
import {FontAwesome} from "@expo/vector-icons";
import {theme} from "@/constants/theme";
import {useRouter} from "expo-router";
import { Ionicons } from '@expo/vector-icons';

const AppNavigationPanel = () => {

    const router = useRouter();

    return (
        <View style={styles.appNavigationPanel}>
            <TouchableOpacity onPress={() => router.push("/homemap")}>
                {/*<FontAwesome name="table" size={40} color="black" />*/}
                <Ionicons name="calendar-outline" size={40} color={theme.colors.dark} />

            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/homemap")}>
                <Ionicons name="home-outline" size={40} color={theme.colors.dark} />

            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/user")}>
                <Ionicons name="person-outline" size={40} color={theme.colors.dark} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    appNavigationPanel: {
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: 80,
        backgroundColor: theme.colors.secondary,
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
    }
});

export default AppNavigationPanel;
