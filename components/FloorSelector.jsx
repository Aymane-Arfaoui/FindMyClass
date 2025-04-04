import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import PropTypes from 'prop-types';

const FloorSelector = ({ floorKeys, selectedFloorKey, setSelectedFloorKey, onChangeUpdateRoute, onChangeUpdateRouteTemp }) => {
    if (floorKeys.length <= 1) return null;

    const testFunc = () => {

        const currentIndex = floorKeys.indexOf(selectedFloorKey);
        if (currentIndex < floorKeys.length - 1) setSelectedFloorKey(floorKeys[currentIndex + 1]);

    };


    return (
        <View style={styles.floorPanel}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
                <TouchableOpacity
                    style={[styles.arrowButton, floorKeys.indexOf(selectedFloorKey) === 0 && styles.arrowDisabled]}
                    onPress={() => {
                        const currentIndex = floorKeys.indexOf(selectedFloorKey);
                        if (currentIndex > 0) setSelectedFloorKey(floorKeys[currentIndex - 1]);
                    }}
                    disabled={floorKeys.indexOf(selectedFloorKey) === 0}
                >
                    <Ionicons name="chevron-back" size={20} color={theme.colors.primaryDark} />
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
                            {floorKey}
                        </Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity
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
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.primaryDark} />
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

const styles = StyleSheet.create({
    floorPanel: {
        position: 'absolute',
        top: 700,
        left: 15,
        right: 15,
        backgroundColor: theme.colors.white,
        borderRadius: theme.radius.xl,
        paddingVertical: 12,
        paddingHorizontal: 15,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        zIndex: 10,
    },
    scrollContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    arrowButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.gray,
        marginHorizontal: 5,
    },
    arrowDisabled: {
        backgroundColor: theme.colors.grayDark,
        opacity: 0.5,
    },
    floorButton: {
        paddingVertical: 8,
        paddingHorizontal: 18,
        marginHorizontal: 5,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.white,
        borderWidth: 1,
        borderColor: theme.colors.grayDark,
    },
    floorButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primaryDark,
    },
    floorButtonText: {
        fontSize: 16,
        color: theme.colors.textLight,
        fontWeight: '500',
    },
    floorButtonTextActive: {
        color: theme.colors.white,
        fontWeight: 'bold',
    },
});
