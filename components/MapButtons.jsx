import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Platform, StyleSheet, Text, TouchableOpacity, View, Animated} from 'react-native';
import PropTypes from "prop-types";
import {ThemeContext} from '@/context/ThemeProvider';

const MapButtons = ({onPress}) => {
    const [selectedLocation, setSelectedLocation] = useState('SGW');
    const {theme, isDark} = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);
    const locations = {
        SGW: [-73.5787, 45.4963],     // SGW Coordinates
        Loyola: [-73.6405, 45.4582]    // Loyola Coordinates
    };

    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: selectedLocation === 'SGW' ? 0 : 1,
            duration: 600,
            useNativeDriver: false
        }).start();
        onPress(locations[selectedLocation]);
    }, [selectedLocation]);

    const handlePress = (location) => {
        setSelectedLocation(location);
    };

    const translateX = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 90]
    });

    return (
        <View style={styles.buttonContainer} testID={'map-toggle-button'}>
            <View style={styles.toggleWrapper}>

                <Animated.View
                    style={[
                        styles.activeButton,
                        { transform: [{ translateX }] }
                    ]}
                />
                <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={() => handlePress('SGW')}
                    testID={'sgw-button'}
                >
                    <Text
                        style={[
                            styles.label,
                            selectedLocation === 'SGW' &&
                            (isDark ? styles.activeLabelDark : styles.activeLabel)
                        ]}
                    >
                        SGW
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={() => handlePress('Loyola')}
                    testID={'loyola-button'}
                >
                    <Text
                        style={[
                            styles.label,
                            selectedLocation === 'Loyola' &&
                            (isDark ? styles.activeLabelDark : styles.activeLabel)
                        ]}
                    >
                        Loyola
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

MapButtons.propTypes = {
    onPress: PropTypes.func.isRequired,
};

const createStyles = (theme) =>
    StyleSheet.create({
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
            backgroundColor: theme.colors.backgroundNav,
            borderRadius: 20,
            padding: 2,
            ...Platform.select({
                ios: {
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                },
                android: {
                    elevation: 5,
                }
            })
        },
        toggleButton: {
            flex: 1,
            paddingVertical: Platform.OS === 'ios' ? 12 : 10,
            paddingHorizontal: 20,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 20,
        },
        activeButton: {
            position: 'absolute',
            width: 86,
            height: '100%',
            backgroundColor: theme.colors.blueDark,
            borderRadius: 19,
            zIndex: -1,
            top: 2,
            marginLeft: 2,
            bottom: 2,
        },
        label: {
            fontSize: 15,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        activeLabel: {
            color: theme.colors.white,
        },
        activeLabelDark: {
            color: theme.colors.dark,
        },
    });

export default MapButtons;
