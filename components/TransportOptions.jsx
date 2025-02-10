import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { theme } from '../constants/theme';
import { hp, wp } from '../helpers/common';

const TransportOptions = ({ modeSelected = 'walking', setModeSelected }) => {
    return (
        <View style={styles.container}>
            <Pressable
                onPress={() => setModeSelected('driving')}
                style={[styles.option, modeSelected === 'driving' && styles.selected]}>
                <Icon name="car" size={hp(2)} color={modeSelected === 'driving' ? 'black' : 'white'} />
                <Text style={[styles.text, modeSelected === 'driving' && styles.selectedText]}> 4 min</Text>
            </Pressable>
            <Pressable
                onPress={() => setModeSelected('transit')}
                style={[styles.option, modeSelected === 'transit' && styles.selected]}>
                <Icon name="bus" size={hp(2)} color={modeSelected === 'transit' ? 'black' : 'white'} />
                <Text style={[styles.text, modeSelected === 'transit' && styles.selectedText]}> 12 min</Text>
            </Pressable>
            <Pressable
                onPress={() => setModeSelected('walking')}
                style={[styles.option, modeSelected === 'walking' && styles.selected]}>
                <Icon name="walking" size={hp(2)} color={modeSelected === 'walking' ? 'black' : 'white'} />
                <Text style={[styles.text, modeSelected === 'walking' && styles.selectedText]}> 3 min</Text>
            </Pressable>
            <Pressable
                onPress={() => setModeSelected('bicycling')}
                style={[styles.option, modeSelected === 'bicycling' && styles.selected]}>
                <Icon name="bicycle" size={hp(2)} color={modeSelected === 'bicycling' ? 'black' : 'white'} />
                <Text style={[styles.text, modeSelected === 'bicycling' && styles.selectedText]}> 3 min</Text>
            </Pressable>
        </View>
    );
};

export default TransportOptions;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.blueDark,
        paddingTop: hp(1),
        paddingBottom: hp(1),
        borderBottomRightRadius: theme.radius.lg,
        borderBottomLeftRadius: theme.radius.lg,
        justifyContent: 'space-evenly',
    },
    option: {
        flexDirection: 'row',
        flexShrink: 1,
        paddingVertical: hp(0.5),
        paddingHorizontal: wp(2),
        borderRadius: theme.radius.md,
        alignItems: 'center',
        marginRight: wp(5),
    },
    text: {
        color: 'white',
        fontSize: hp(1.8),
    },
    selected: {
        backgroundColor: 'white',
        borderRadius: theme.radius.lg,
        paddingVertical: hp(0.5),
        paddingHorizontal: wp(2),
    },
    selectedText: {
        color: 'black',
        fontWeight: 'bold',
    },
});
