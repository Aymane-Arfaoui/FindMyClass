import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { theme } from "@/constants/theme";
import Icon from 'react-native-vector-icons/FontAwesome';
import { getShuttleTimes } from '@/services/shuttleService';
import { useState, useEffect } from "react";

const ShuttleSchedule = () => {
    const router = useRouter();
    const [shuttleData, setShuttleData] = useState([]);
    const [previousShuttle, setPreviousShuttle] = useState(null);
    const [previousShuttleMinutesAgo, setPreviousShuttleMinutesAgo] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const fetchShuttleData = () => {
            const { nextShuttles, allShuttles } = getShuttleTimes(5);

            if (Array.isArray(nextShuttles) && (nextShuttles.length > 0 || (Array.isArray(allShuttles) && allShuttles.length > 0))) {
                setErrorMessage("");
                const now = new Date();

                const formattedShuttles = nextShuttles.map((time, index) => {
                    const [hh, mm] = time.split(":").map(Number);
                    const shuttleTime = new Date();
                    shuttleTime.setHours(hh, mm, 0, 0);
                    const minutesUntilDeparture = Math.round((shuttleTime - now) / 60000);

                    return {
                        id: String(index + 1),
                        time,
                        status: minutesUntilDeparture <= 0 ? 'Departed' : 'Departing',
                        minutes: minutesUntilDeparture
                    };
                });

                if (Array.isArray(allShuttles)) {
                    const departedShuttles = allShuttles.filter(shuttle => shuttle.shuttleTime < now.getHours() * 60 + now.getMinutes());

                    if (departedShuttles.length > 0) {
                        const lastDepartedShuttle = departedShuttles[departedShuttles.length - 1];
                        const lastShuttleTime = new Date();
                        const [hh, mm] = lastDepartedShuttle.time.split(":").map(Number);
                        lastShuttleTime.setHours(hh, mm, 0, 0);
                        const minutesAgo = Math.round((now - lastShuttleTime) / 60000);

                        setPreviousShuttle(lastDepartedShuttle.time);
                        setPreviousShuttleMinutesAgo(minutesAgo);

                        const previousShuttleData = {
                            id: "previous",
                            time: lastDepartedShuttle.time,
                            status: 'Departed',
                            minutes: -minutesAgo
                        };

                        setShuttleData([previousShuttleData, ...formattedShuttles]);
                    }
                }
            } else {
                setShuttleData([]);
                setErrorMessage("No more shuttles available today.");
            }
        };

        fetchShuttleData();
        const interval = setInterval(fetchShuttleData, 60000);

        return () => clearInterval(interval);
    }, []);

    const handleGoBack = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={styles.header}></View>
            <View style={styles.concordiaShuttleBox}>
                <TouchableOpacity onPress={handleGoBack}>
                    <Icon name="chevron-left" size={25} color={theme.colors.dark} style={styles.chevronLeft} />
                </TouchableOpacity>
                <Text style={styles.concordiaShuttleText}>Concordia Shuttle</Text>
            </View>
            {errorMessage ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
            ) : (
                <FlatList
                    data={shuttleData}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={[styles.shuttleCard, item.status === 'Departed' && styles.previousShuttle]}>
                            <View style={styles.shuttleInfo}>
                                <View style={styles.imageTextContainer}>
                                    <Image source={require('@/assets/images/ConcordiaLogo.png')} style={styles.logoImage} />
                                    <Text style={styles.shuttleTitle}>Shuttle</Text>
                                </View>
                                <Text style={styles.routeText}>SGW ➝ Loyola</Text>
                                <Text style={styles.departureText}>
                                    {item.status === 'Departed' ? `Departed at ${item.time}` : `Departing at ${item.time}`}
                                </Text>
                            </View>
                            <Text style={[styles.minutesText, item.status === 'Departed' && styles.previousShuttleText]}>
                                {item.status === 'Departed' ? `${Math.abs(item.minutes)} min ago` : `${item.minutes} min`}
                            </Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

export default ShuttleSchedule;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.white,
    },
    header: {
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 25,
        paddingBottom: 40,
    },
    concordiaShuttleBox: {
        backgroundColor: theme.colors.gray,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        shadowColor: theme.colors.grayDark,
    },
    chevronLeft: {
        paddingLeft: 10,
    },
    concordiaShuttleText: {
        color: theme.colors.dark,
        fontSize: 19,
        fontWeight: theme.fonts.bold,
        textAlign: 'center',
        flex: 1,
    },
    shuttleCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray,
        alignItems: 'center',
    },
    shuttleInfo: {
        flex: 1,
    },
    imageTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoImage: {
        width: 25,
        height: 25,
        marginRight: 10,
    },
    shuttleTitle: {
        fontSize: 18,
        fontWeight: theme.fonts.bold,
    },
    routeText: {
        fontSize: 14,
        fontWeight: theme.fonts.bold,
        color: theme.colors.textLight,
    },
    departureText: {
        fontSize: 14,
        color: theme.colors.textLight,
    },
    minutesText: {
        fontSize: 16,
        fontWeight: theme.fonts.bold,
        color: theme.colors.grayDark,
    },
    previousShuttle: {
        backgroundColor: theme.colors.white,
    },
    previousShuttleText: {
        color: theme.colors.error,
    },
    departed: {
        color: theme.colors.error,
    },
    errorContainer: {
        padding: 20,
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        fontWeight: theme.fonts.bold,
        color: theme.colors.error,
    },
});