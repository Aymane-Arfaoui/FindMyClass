import React, {useContext, useMemo} from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {getUserLocation} from '@/services/userService';
import PropTypes from 'prop-types';
import {ThemeContext} from "@/context/ThemeProvider";

const LiveLocationButton = ({onPress}) => {
    const { theme } = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);
    const handleLiveLocationPress = async () => {
        const location = await getUserLocation();
        onPress([location.lng, location.lat]);
    };

    return (
        <TouchableOpacity
            testID={'live-location-button'}
            style={styles.liveLocationButton}
            onPress={handleLiveLocationPress}
        >
            <Ionicons name="locate" size={28} color="#fff" />
        </TouchableOpacity>
    );
};

const createStyles = (theme) =>
    StyleSheet.create({
    liveLocationButton: {
        position: 'absolute',
        bottom: 100,
        left: 15,
        backgroundColor: theme.colors.blueDark,
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 10,
    },
});
LiveLocationButton.propTypes={
    onPress:PropTypes.func
}
export default LiveLocationButton;
