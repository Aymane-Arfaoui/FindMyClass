import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from "@/constants/theme";

const MapButtons = ({ onPress }) => {
    const [selectedLocation, setSelectedLocation] = useState('SGW');

    const locations = {
        SGW: [-73.5787, 45.4963],     // SGW Coordinates
        Loyola: [-73.6405, 45.4582]    // Loyola Coordinates
    };

    useEffect(() => {
        onPress(locations[selectedLocation]);
    }, []);

    const handlePress = (location) => {
        setSelectedLocation(location);
        onPress(locations[location]);
    };

    return (
        <View style={styles.buttonContainer} testID={'map-toggle-button'}>
            <View style={styles.toggleWrapper}>
                <TouchableOpacity
                    style={[styles.toggleButton, selectedLocation === 'SGW' && styles.activeButton]}
                    onPress={() => handlePress('SGW')}
                    testID={'sgw-button'}
                >
                    <Text style={[styles.label, selectedLocation === 'SGW' && styles.activeLabel]}>SGW</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, selectedLocation === 'Loyola' && styles.activeButton]}
                    onPress={() => handlePress('Loyola')}
                    testID={'loyola-button'}
                >
                    <Text style={[styles.label, selectedLocation === 'Loyola' && styles.activeLabel]}>Loyola</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    buttonContainer: {
        position: 'absolute',
        top: 95,
        left: 110,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        width: 180,
        height: 45,
    },
    toggleWrapper: {
        flexDirection: 'row',
        backgroundColor: theme.colors.white,
        borderRadius: 20,
        padding: 2,
        elevation: 5,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    activeButton: {
        backgroundColor: theme.colors.blueDark,
    },
    label: {
        fontSize: 15,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    activeLabel: {
        color: theme.colors.white,
    }
});

export default MapButtons;
