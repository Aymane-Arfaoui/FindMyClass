import React from 'react';
import {StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PropTypes from "prop-types";

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
ScreenWrapper.propTypes={
    containerStyle:PropTypes.object
}

export default ScreenWrapper;