import React from 'react';
import {StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ScreenWrapper = ({ children, containerStyle }) => {
    return (
        <SafeAreaView testID={'screen-wrapper'} style={[styles.container, containerStyle]}>
            {children}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default ScreenWrapper;