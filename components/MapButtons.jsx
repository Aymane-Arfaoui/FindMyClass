import React, {useContext, useEffect, useMemo, useState} from 'react';
import {Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import PropTypes from "prop-types";
import {ThemeContext} from '@/context/ThemeProvider';

const MapButtons = ({onPress, onCampusChange}) => {
    const [selectedLocation, setSelectedLocation] = useState('SGW');
    const {theme, isDark} = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);
    const locations = {
        SGW: [-73.5789, 45.4973],     // SGW Coordinates
        LOYOLA: [-73.6409, 45.4582]    // Loyola Coordinates
    };

    useEffect(() => {
        onPress(locations[selectedLocation]);
        onCampusChange && onCampusChange(selectedLocation);
    }, [selectedLocation]);

    const handlePress = (location) => {
        setSelectedLocation(location);
        onPress(locations[location]);
        onCampusChange && onCampusChange(location);
    };

    return (
        <View style={styles.buttonContainer} testID={'map-toggle-button'}>
            <View style={styles.toggleWrapper}>
                <TouchableOpacity
                    style={[styles.toggleButton, selectedLocation === 'LOYOLA' && styles.activeButton]}
                    onPress={() => handlePress('LOYOLA')}
                    testID={'loyola-button'}
                >
                    <Text
                        style={[
                            styles.label,
                            selectedLocation === 'LOYOLA' &&
                            (isDark ? styles.activeLabelDark : styles.activeLabel)
                        ]}
                    >
                        Loyola
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, selectedLocation === 'SGW' && styles.activeButton]}
                    onPress={() => handlePress('SGW')}
                    testID={'sgw-button'}
                >
                    <Text style={[
                        styles.label,
                        selectedLocation === 'SGW' && (isDark ? styles.activeLabelDark : styles.activeLabel)
                    ]}>SGW</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

MapButtons.propTypes = {
    onPress: PropTypes.func.isRequired,
    onCampusChange: PropTypes.func
};

const createStyles = (theme) => StyleSheet.create({
    buttonContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        alignSelf: 'center',
        backgroundColor: theme.colors.cardBackground,
        borderRadius: 25,
        padding: 5,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 1
    },
    toggleWrapper: {
        flexDirection: 'row',
        backgroundColor: theme.colors.cardBackground,
        borderRadius: 20,
        padding: 2,
    },
    toggleButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    activeButton: {
        backgroundColor: theme.colors.primary,
    },
    label: {
        color: theme.colors.text,
        fontSize: 14,
        fontWeight: '500',
    },
    activeLabel: {
        color: '#ffffff',
    },
    activeLabelDark: {
        color: '#ffffff',
    },
});

export default MapButtons;
