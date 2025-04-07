import React, {useContext, useMemo} from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import {ThemeContext} from "@/context/ThemeProvider";
import {hp} from '@/helpers/common';

const FloorSelector = ({ floorKeys, selectedFloorKey, setSelectedFloorKey, onChangeUpdateRoute, onChangeUpdateRouteTemp }) => {
    const { theme } = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);

    if (floorKeys.length <= 1) return null;

    const testFunc = () => {

        const currentIndex = floorKeys.indexOf(selectedFloorKey);
        if (currentIndex < floorKeys.length - 1) setSelectedFloorKey(floorKeys[currentIndex + 1]);

    };


    return (
        <View style={styles.floorPanel}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
                <TouchableOpacity
                    testID={'back-arrow'}
                    style={[styles.arrowButton, floorKeys.indexOf(selectedFloorKey) === 0 && styles.arrowDisabled]}
                    onPress={() => {
                        const currentIndex = floorKeys.indexOf(selectedFloorKey);
                        if (currentIndex > 0) setSelectedFloorKey(floorKeys[currentIndex - 1]);
                    }}
                    disabled={floorKeys.indexOf(selectedFloorKey) === 0}
                >
                    <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
                </TouchableOpacity>
                {floorKeys.map((floorKey) => (
                    <TouchableOpacity
                        testID={`floor-${floorKey}-button`}
                        key={floorKey}
                        onPress={() => setSelectedFloorKey(floorKey)}
                        style={[
                            styles.floorButton,
                            selectedFloorKey === floorKey && styles.floorButtonActive,
                        ]}
                    >
                        <Text
                            style={[
                                styles.floorButtonText,
                                selectedFloorKey === floorKey && styles.floorButtonTextActive,
                            ]}
                        >
                            {(floorKey === "3")?"VE2":floorKey}
                        </Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity
                    testID={'forward-arrow'}
                    style={[styles.arrowButton, floorKeys.indexOf(selectedFloorKey) === floorKeys.length - 1 && styles.arrowDisabled]}
                    onPress={() => {
                        onChangeUpdateRoute();
                        onChangeUpdateRouteTemp();

                        testFunc();
                        // const currentIndex = floorKeys.indexOf(selectedFloorKey);
                        // if (currentIndex < floorKeys.length - 1) setSelectedFloorKey(floorKeys[currentIndex + 1]);
                    }}
                    disabled={floorKeys.indexOf(selectedFloorKey) === floorKeys.length - 1}
                >
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};
FloorSelector.propTypes={
    floorKeys:PropTypes.array,
    selectedFloorKey: PropTypes.string,
    setSelectedFloorKey:PropTypes.func,
    onChangeUpdateRoute: PropTypes.func,
    onChangeUpdateRouteTemp: PropTypes.func,
}
export default FloorSelector;

const createStyles = (theme) =>
    StyleSheet.create({
        // MAKE THIS TRANSAPRENT
        floorPanel: {
            position: 'absolute',
            top: hp(75),
            left: 15,
            right: 15,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 20,
            paddingVertical: 10,
            paddingHorizontal: 10,
            // elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 5,
            zIndex: 10,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
        },
        scrollContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        arrowButton: {
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 16,
            backgroundColor: theme.colors.cardSecondary,
            marginHorizontal: 4,
        },
        arrowDisabled: {
            backgroundColor: theme.colors.cardDisabled,
            opacity: 0.6,
        },
        floorButton: {
            paddingVertical: 10,
            paddingHorizontal: 20,
            marginHorizontal: 4,
            borderRadius: 16,
            backgroundColor: theme.colors.cardSecondary,
            borderWidth: 1,
            borderColor: theme.colors.cardBorder,
        },
        floorButtonActive: {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primaryDark,
        },
        floorButtonText: {
            fontSize: 16,
            color: theme.colors.text,
            fontWeight: '500',
        },
        floorButtonTextActive: {
            color: theme.colors.white,
            fontWeight: 'bold',
        },
    });


