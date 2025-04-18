import React, {useContext, useMemo} from "react";
import {StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import PropTypes from "prop-types";
import { ThemeContext } from '@/context/ThemeProvider'


const SmartPlannerHeader = ({onBack, onAddTask, onPlanRoute, isPlanRouteMode, day, weekday, monthYear}) => {
    const { theme } = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);
    return (
        <View style={styles.headerContainer}>
            <TouchableOpacity testID={'back-button'} style={styles.backButton} onPress={onBack}>
                <Ionicons name="chevron-back" size={28} color={theme.colors.dark} />
            </TouchableOpacity>

            <View style={styles.dateSection}>
                <Text style={styles.dateText}>{day}</Text>
                <View>
                    <Text style={styles.weekdayText}>{weekday}</Text>
                    <Text style={styles.monthYearText}>{monthYear}</Text>
                </View>
            </View>

            <View style={styles.rightActions}>
                {!isPlanRouteMode && (
                    <TouchableOpacity testID={'plan-route-button'} style={styles.todayButton} onPress={onPlanRoute}>
                        <Text style={styles.todayText}>Plan Route</Text>
                    </TouchableOpacity>
                )}
                {!isPlanRouteMode && (
                    <TouchableOpacity testID={'add-task-button'} style={styles.addButton} onPress={onAddTask}>
                        <Ionicons name="add" size={28} color="white"/>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

SmartPlannerHeader.propTypes={
    onBack: PropTypes.func, onAddTask: PropTypes.func, onPlanRoute: PropTypes.func, isPlanRouteMode: PropTypes.bool, day: PropTypes.any, weekday: PropTypes.any, monthYear: PropTypes.any

}


const createStyles = (theme) => StyleSheet.create({
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 50,
        backgroundColor: theme.colors.smartPlannerHeader,
        paddingBottom: 20,
    },
    backButton: {
        position: "absolute",
        top: 1,
        left: 15,
        padding: 2,
        marginLeft: -7,
    },
    dateSection: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 20,
    },
    dateText: {
        fontSize: 44,
        fontWeight: "bold",
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
        flexDirection: "row",
        alignItems: "center",
    },
    todayButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 10,
        marginRight: 20,
    },
    todayText: {
        color: '#fff',
        fontWeight: "bold",
    },
    addButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: 50,
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
});

export default SmartPlannerHeader;
