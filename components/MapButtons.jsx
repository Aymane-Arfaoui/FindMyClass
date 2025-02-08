import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from "@/constants/theme";

const MapButtons = ({ onPress }) => {
    const [selectedButton, setSelectedButton] = useState(null);

    const handlePress = (location) => {
        setSelectedButton(location);

        const coordinates = location === 'SGW'
            ? [-73.5780, 45.4972] //SGW
            : [-73.6405, 45.4582]; //Loyola

        onPress(coordinates);
    };

    return (
        <View style={styles.buttonContainer}>
            <TouchableOpacity
                style={[styles.button, selectedButton === 'SGW' && styles.selectedButton]}
                onPress={() => handlePress('SGW')}
            >

                <Text style={[styles.buttonText, selectedButton === 'SGW' && styles.selectedButtonText]}>SGW</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, selectedButton === 'Loyola' && styles.selectedButton]}
                onPress={() => handlePress('Loyola')}
            >
                <Text style={[styles.buttonText, selectedButton === 'Loyola' && styles.selectedButtonText]}>Loyola</Text>
            </TouchableOpacity>
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
        shadowOffset: { width: 4, height: 4 },
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