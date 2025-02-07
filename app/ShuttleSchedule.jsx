import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {theme} from "@/constants/theme";
import Icon from 'react-native-vector-icons/FontAwesome';
import SearchBars from '../components/SearchBars';


// hard coded, need to be removed when the backend function is ready
const shuttleData = [
    { id: '1', time: '9:30 am', status: 'Departed', minutes: -11 },
    { id: '2', time: '9:45 am', status: 'Departing', minutes: 4 },
    { id: '3', time: '10:00 am', status: 'Departing', minutes: 19 },
    { id: '4', time: '10:15 am', status: 'Departing', minutes: 34 },
    { id: '5', time: '10:30 am', status: 'Departing', minutes: 49 },
    { id: '6', time: '10:30 am', status: 'Departing', minutes: 49 },
    { id: '7', time: '10:15 am', status: 'Departing', minutes: 34 },
    { id: '8', time: '10:30 am', status: 'Departing', minutes: 49 },
    { id: '9', time: '10:30 am', status: 'Departing', minutes: 49 },
];

const ShuttleSchedule = () => {
    const router = useRouter();


    const handleGoBack = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <View style={styles.header}></View>


            {/*to call the search bar component*/}
            {/*<View>*/}
            {/*    <SearchBars />*/}
            {/*</View>*/}

            <View style={styles.concordiaShuttleBox}>
                <TouchableOpacity onPress={handleGoBack}>
                    <Icon name="chevron-left" size={25} color={theme.colors.dark} style={styles.chevronLeft} />
                </TouchableOpacity>
                <Text style={styles.concordiaShuttleText}>Concordia Shuttle</Text>
            </View>

            <FlatList
                data={shuttleData}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.shuttleCard}>
                        <View style={styles.shuttleInfo}>
                            <View style={styles.imageTextContainer}>
                                <Image source={require('@/assets/images/ConcordiaLogo.png')} style={styles.logoImage} />
                                <Text style={styles.shuttleTitle}>Shuttle</Text>
                            </View>
                            <Text style={styles.routeText}>SGW ➝ Loyola</Text>
                            <Text style={styles.departureText}>Departing at {item.time}</Text>
                        </View>
                        <Text style={[styles.minutesText, item.minutes < 0 && styles.departed]}>
                            {item.minutes < 0 ? `${Math.abs(item.minutes)} min ago` : `${item.minutes} min`}
                        </Text>
                    </View>
                )}
            />
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
    headerTitle: {
        color: theme.colors.white,
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    icon: {
        marginRight: 10,
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
        fontWeight: 'bold',
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
        fontWeight: 'bold',
    },
    routeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.textLight,
    },
    departureText: {
        fontSize: 14,
        color: theme.colors.textLight,
    },
    minutesText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.grayDark,
    },
    departed: {
        color: theme.colors.error,
    },


    // this is not working yet
    text: {
        fontFamily: 'Verdana',
        color: theme.colors.primaryLight,
    },
});















