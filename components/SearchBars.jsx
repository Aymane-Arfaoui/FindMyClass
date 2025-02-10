import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome";
import { theme } from "@/constants/theme";
import {useRouter} from "expo-router";

const SearchBars = ({start, destination}) => {
    const [location1, setLocation1] = useState(start);
    const [location2, setLocation2] = useState(destination);


    const swapLocations = () => {
        const temp = location1;
        setLocation1(location2);
        setLocation2(temp);
    };

    const router = useRouter();
    const handleGoBack = () => {
        router.back();
    };

    return (

        <View style={styles.locationContainer}>
            <TouchableOpacity testID={'go-back-button-SearchBarComponent'} onPress={handleGoBack}>
                <Icon name="chevron-left" size={20} color={theme.colors.white} style={styles.chevronLeft}  />
            </TouchableOpacity>
            <View testID={'map-marker-SearchBarComponent'} style={styles.iconContainer}>
                <Icon name="circle" size={12} color="#0970de" />
                <View style={styles.dottedLine} />
                <Icon name="map-marker" size={16} color={theme.colors.white} />
            </View>

            <View style={styles.inputContainer}>
                <TextInput testID={'source-input'}
                    style={styles.locationTextInput}
                    value={location1}
                    onChangeText={setLocation1}
                    placeholder="Enter Source Location"
                    placeholderTextColor={theme.colors.white}
                />
                <TextInput
                    testID={'destination-input'}
                    style={styles.locationTextInput}
                    value={location2}
                    onChangeText={setLocation2}
                    placeholder="Enter Destination Location"
                    placeholderTextColor={theme.colors.white}
                />
            </View>

            <TouchableOpacity testID={'swap-location-button'} onPress={swapLocations} style={styles.swapButton}>
                <Icon name="exchange" size={20} color={theme.colors.white} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    icon: {
        marginRight: 10,
    },
    iconContainer: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginRight: 10,
    },
    locationContainer: {
        backgroundColor: theme.colors.primary,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationTextInput: {
        backgroundColor: 'transparent',
        borderColor: theme.colors.white,
        borderWidth: 1,
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        fontSize: 16,
        color: theme.colors.white,
    },
    inputContainer: {
        flex: 1,
        justifyContent: 'space-between',
    },
    swapButton: {
        marginLeft: 10,
    },
    dottedLine: {
        width: 1,
        height: 35,
        borderStyle: 'dotted',
        borderWidth: 1.5,
        borderColor: theme.colors.white,
        marginVertical: 4,
    },
    dottedLineContainer: {
        position: 'absolute',
        left: 25,
        top: 50,
        bottom: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chevronLeft: {
        marginTop: -70,
    },

});

export default SearchBars;