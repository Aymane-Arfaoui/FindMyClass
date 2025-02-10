import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {theme} from "@/constants/theme";

const MapButtons = ({onPress}) => {
    const [selectedButton, setSelectedButton] = useState('SGW');

    const locations = {
        SGW: [-73.5787, 45.4963],     // SGW Coordinates
        Loyola: [-73.6405, 45.4582] // Loyola Coordinates
    };

    useEffect(() => {
        onPress(locations.SGW);
    }, []);

    const handlePress = (location) => {
        const coordinates = locations[location];

        if (selectedButton === location) {
            onPress(coordinates);
        } else {
            setSelectedButton(location);
            onPress(coordinates);
        }
    };

    return (
        <View style={styles.buttonContainer} testID={'map-buttons'}>
            {Object.keys(locations).map((location) => (
                <TouchableOpacity
                    key={location}
                    style={[styles.button, selectedButton === location && styles.selectedButton]}
                    onPress={() => handlePress(location)}
                    testID={location}
                >
                    <Text style={[styles.buttonText, selectedButton === location && styles.selectedButtonText]}>
                        {location}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    buttonContainer: {
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        marginTop: 10,
    },
    button: {
        backgroundColor: theme.colors.white,
        marginHorizontal: 15,
        height: 50,
        width: 110,
        borderRadius: theme.radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 15,
        shadowColor: theme.colors.dark,
        shadowOffset: {width: 4, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: theme.radius.xs,
        elevation: 5,
    },
    buttonText: {
        color: theme.colors.text,
        fontSize: 17,
        fontWeight: theme.fonts.bold,
    },
    selectedButton: {
        backgroundColor: theme.colors.blueDark,
    },
    selectedButtonText: {
        color: theme.colors.white,
    },
});

export default MapButtons;
