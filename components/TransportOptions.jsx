import {Pressable, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import {theme} from '@/constants/theme';
import {hp, wp} from '@/helpers/common';
import PropTypes from "prop-types";

const TransportOptions = ({ modeSelected, setModeSelected, travelTimes }) => {
    const transportModes = [
        { mode: 'driving', icon: 'car', time: travelTimes.DRIVE },
        { mode: 'transit', icon: 'bus', time: travelTimes.TRANSIT },
        { mode: 'walking', icon: 'walking', time: travelTimes.WALK },
        { mode: 'bicycling', icon: 'bicycle', time: travelTimes.BICYCLE },
    ];
    return (
        <View style={styles.container} testID={'transport-options'}>
            {transportModes.map(({mode, icon, time}) => (
                <Pressable
                    key={mode}
                    onPress={() => setModeSelected(mode)}
                    style={[
                        styles.option,
                        modeSelected === mode && styles.selectedOption
                    ]}
                >
                    <Icon
                        name={icon}
                        size={hp(2)}
                        color={modeSelected === mode ? theme.colors.primary : 'white'}
                        style={styles.icon}
                    />
                    <Text style={[
                        styles.text,
                        modeSelected === mode && styles.selectedText
                    ]}>
                        {time}
                    </Text>
                </Pressable>
            ))}
        </View>
    );
};
TransportOptions.propTypes={
    modeSelected: PropTypes.string,
    setModeSelected: PropTypes.func,
    travelTimes: PropTypes.object
}

export default TransportOptions;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: theme.colors.primary,
        paddingVertical: hp(1.5),
        marginTop: 3,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: hp(0.5)},
        shadowOpacity: 0.2,
        shadowRadius: wp(2),
        overflow: 'hidden',
    },

    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: hp(1),
        paddingHorizontal: wp(1),
        borderRadius: wp(2),
        backgroundColor: 'transparent',
    },

    selectedOption: {
        backgroundColor: 'white',
        paddingVertical: hp(1),
        paddingHorizontal: wp(2),
        borderRadius: wp(4),
        elevation: 4,
    },

    icon: {
        marginRight: wp(2),
    },

    text: {
        color: 'white',
        fontSize: hp(1.8),
    },

    selectedText: {
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
});