import React, {useState} from 'react';
import {Platform, StyleSheet, TextInput, TouchableOpacity, View, Text,} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {theme} from '@/constants/theme';

import {hp, wp} from '@/helpers/common';

const IndoorSearchBars = ({startLocation,
                              setStartLocation,
                              destination,
                              onBackPress,
                          }) => {

    const [localStart, setLocalStart] = useState(startLocation);

    return (
        <View style={styles.containerIM} testID={'search-bars'}>

            <TouchableOpacity onPress={onBackPress} style={styles.backButtonIM}>
                <Ionicons name="chevron-back" size={26} color="white"/>
            </TouchableOpacity>


            <View style={styles.inputContainerIM}>
                <Ionicons name="radio-button-on" size={16} color={theme.colors.primary} style={styles.iconIM}/>
                <TextInput
                    style={styles.inputIM}
                    value={localStart}
                    onChangeText={(text) => setLocalStart(text)}
                    placeholder="Starting Point"
                />
            </View>


            <View style={styles.inputContainerIM}>
                <Ionicons name="location-sharp" size={16} color={theme.colors.primary} style={styles.iconIM}/>
                <TextInput
                    style={styles.inputIM}
                    value={destination}
                    // onChangeText={(text) => handleAddressChange(text, false)}
                    placeholder="Destination"
                />
            </View>


            <View>
                <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => setStartLocation(localStart)}
                >

                <Text style={styles.buttonText}>Update Start Location</Text>

                </TouchableOpacity>

            </View>
        </View>
    );
};


export default IndoorSearchBars;


const styles = StyleSheet.create({
    containerIM: {
        backgroundColor: theme.colors.primary,
        paddingTop: Platform.OS === 'ios' ? hp(10) : hp(8),
        paddingHorizontal: wp(4),
        paddingBottom: hp(1),
        borderBottomLeftRadius: wp(6),
        borderBottomRightRadius: wp(6),
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: hp(0.5)},
        shadowOpacity: 0.2,
        shadowRadius: wp(3),
    },

    backButtonIM: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? hp(6) : hp(5),
        left: wp(2),
        padding: wp(1),
        borderRadius: wp(5),
    },

    inputContainerIM: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        paddingVertical: hp(1.5),
        paddingHorizontal: wp(3),
        borderRadius: wp(4),
        marginTop: hp(1.2),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: hp(0.3)},
        shadowOpacity: 0.1,
        shadowRadius: wp(2),
    },

    iconIM: {
        marginRight: wp(2),
    },

    inputIM: {
        flex: 1,
        fontSize: hp(1.8),
        color: theme.colors.dark,
    },

    confirmButton: {
        backgroundColor: theme.colors.blueDark,
        padding: 10,
        borderRadius: wp(4),
        alignItems: 'center',
        marginTop: 10,
    },

    buttonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },

}
);
