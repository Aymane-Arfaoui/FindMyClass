import React, {useContext, useEffect, useMemo, useState} from 'react';
import {Platform, StatusBar, StyleSheet, TextInput, TouchableOpacity, View,} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {hp, wp} from '@/helpers/common';
import TransportOptions from "@/components/TransportOptions";
import Config from 'react-native-config';
import PropTypes from "prop-types";
import {ThemeContext} from "@/context/ThemeProvider";

const GOOGLE_API_KEY = Config.GOOGLE_PLACES_API_KEY;

const SearchBars = ({
                        currentLocation,
                        destination,
                        onBackPress,
                        modeSelected,
                        setModeSelected,
                        travelTimes

                    }) => {

    const [startLocation, setStartLocation] = useState('Fetching current location...');
    const [endLocation, setEndLocation] = useState(destination || 'Destination');
    const {theme} = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);

    useEffect(() => {
        if (currentLocation?.geometry?.coordinates) {
            const [lng, lat] = currentLocation.geometry.coordinates;
            fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`
            )
                .then((response) => response.json())
                .then((data) => {
                    if (data.results.length > 0) {
                        setStartLocation(data.results[0].formatted_address);
                    } else {
                        setStartLocation('Unable to fetch address');
                    }
                })
                .catch((error) => {
                    console.error('Error fetching address:', error);
                    setStartLocation('Unable to fetch address');
                });
        }
    }, [currentLocation]);


    const [, setSuggestions] = useState([]);
    const handleAddressChange = (text, isStart) => {
        if (text.length > 2) {
            fetch(
                `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&key=${GOOGLE_API_KEY}`
            )
                .then((response) => response.json())
                .then((data) => {
                    if (data.predictions) {
                        setSuggestions(data.predictions);
                    }
                });
        } else {
            setSuggestions([]);
        }

        isStart ? setStartLocation(text) : setEndLocation(text);
    };


    return (
        <View style={styles.container} testID={'search-bars'}>
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle='#fff'
            />
            <TouchableOpacity testID={'back-button'} onPress={onBackPress} style={styles.backButton}>
                <Ionicons name="chevron-back" size={26} color="white"/>
            </TouchableOpacity>


            <View style={styles.inputContainer}>
                <Ionicons name="radio-button-on" size={16} color={theme.colors.primary} style={styles.icon}/>
                <TextInput
                    style={styles.input}
                    value={startLocation}
                    onChangeText={(text) => handleAddressChange(text, true)}
                    placeholder="Starting Point"
                />
            </View>


            <View style={styles.inputContainer}>
                <Ionicons name="location-sharp" size={16} color={theme.colors.primary} style={styles.icon}/>
                <TextInput
                    style={styles.input}
                    value={endLocation}
                    onChangeText={(text) => handleAddressChange(text, false)}
                    placeholder="Destination"
                />
            </View>

            <TransportOptions
                modeSelected={modeSelected}
                setModeSelected={setModeSelected}
                travelTimes={travelTimes}
            />
        </View>
    );
};
const createStyles = (theme) =>
    StyleSheet.create({
        container: {
            backgroundColor: theme.colors.primary,
            paddingTop: Platform.OS === 'ios' ? hp(10) : hp(8),
            paddingHorizontal: wp(4),
            paddingBottom: hp(1),
            borderBottomLeftRadius: wp(6),
            borderBottomRightRadius: wp(6),
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: hp(0.5)},
            shadowOpacity: 0.2,
            shadowRadius: wp(3),
        },

        backButton: {
            position: 'absolute',
            top: Platform.OS === 'ios' ? hp(6) : hp(5),
            left: wp(2),
            padding: wp(1),
            borderRadius: wp(5),
        },

        inputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'white',
            paddingVertical: hp(1.5),
            paddingHorizontal: wp(3),
            borderRadius: wp(4),
            marginTop: hp(1.2),
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: hp(0.3)},
            shadowOpacity: 0.1,
            shadowRadius: wp(2),
        },

        icon: {
            marginRight: wp(2),
        },

        input: {
            flex: 1,
            fontSize: hp(1.8),
            color: 'black',
        },
    });

SearchBars.propTypes = {
    currentLocation: PropTypes.any,
    destination: PropTypes.any,
    onBackPress: PropTypes.func,
    modeSelected: PropTypes.string,
    setModeSelected: PropTypes.func,
    travelTimes: PropTypes.object
}
export default SearchBars;