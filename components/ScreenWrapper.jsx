import React, {useContext, useMemo} from 'react';
import {StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PropTypes from "prop-types";
import {ThemeContext} from "@/context/ThemeProvider";

const ScreenWrapper = ({ children, containerStyle }) => {
    const {theme} = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);

    return (
        <SafeAreaView testID={'screen-wrapper'} style={[styles.container, containerStyle]}>
            {children}
        </SafeAreaView>
    );
};

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.calendarbackground,
    },
});
ScreenWrapper.propTypes={
    children: PropTypes.node,
    containerStyle:PropTypes.object
}

export default ScreenWrapper;