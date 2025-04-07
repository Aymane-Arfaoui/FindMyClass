import React, {useContext, useEffect, useMemo, useState} from 'react';
import {Platform, StyleSheet, TextInput, TouchableOpacity, View,} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {hp, wp} from '@/helpers/common';
import StartPointSearchBar from "@/components/StartPointSearchBar";

import PropTypes from 'prop-types';
import {ThemeContext} from "@/context/ThemeProvider";

const IndoorSearchBars = ({startLocation,
                              setStartLocation,
                              onShowDirectionsUpdate,
                              onShowDirectionsUpdateTemp,
                              destination,
                              onBackPress,
                              navigation,
                              resetTransform,

                          }) => {

    const [localStart, setLocalStart] = useState(startLocation);


    useEffect(() => {

        setStartLocation(localStart)
        onShowDirectionsUpdate();
        onShowDirectionsUpdateTemp();
    }, [localStart, setLocalStart]);

    const { theme } = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);
    return (
        <View style={styles.containerIM} testID={'search-bars'}>


            <TouchableOpacity onPress={onBackPress} style={styles.backButtonIM}>
                <Ionicons name="chevron-back" size={26} color="white"/>
            </TouchableOpacity>


            <View style={styles.inputContainerIMStart}>

                <StartPointSearchBar
                    navigation={navigation}
                    resetTransform={resetTransform}

                    searchQuery={localStart}
                    setSearchQuery={setLocalStart}



                />
            </View>

            <View style={styles.inputContainerIM}>
                <Ionicons name="location-sharp" size={16} color={theme.colors.primary} style={styles.iconIM}/>
                <TextInput
                    style={styles.inputIM}
                    value={destination}
                    placeholder="Destination"
                />
            </View>

        </View>
    );
};

IndoorSearchBars.propTypes = {
    startLocation: PropTypes.string,
    setStartLocation: PropTypes.func,
    onShowDirectionsUpdate: PropTypes.func,
    onShowDirectionsUpdateTemp: PropTypes.func,
    destination: PropTypes.string,
    onBackPress: PropTypes.func,
    navigation: PropTypes.object,
    resetTransform: PropTypes.func,
};
export default IndoorSearchBars;


const createStyles = (theme) => StyleSheet.create({
    containerIM: {
        backgroundColor: theme.colors.primary,
        paddingTop: Platform.OS === 'ios' ? hp(10) : hp(8),
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        elevation: 10,
        shadowColor: theme.colors.dark,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: hp(0.5) },
        shadowRadius: wp(3),
        paddingHorizontal: wp(4),
        paddingBottom: hp(3),
        borderBottomLeftRadius: wp(6),
        borderBottomRightRadius: wp(6),
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
        shadowOffset: { width: 0, height: hp(0.3) },
        shadowOpacity: 0.1,
        shadowRadius: wp(2),
        maxHeight: 250,
    },
    inputContainerIMStart: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        paddingVertical: hp(1),
        borderRadius: wp(4),
        marginTop: hp(1.2),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: hp(0.3) },
        shadowOpacity: 0.1,
        shadowRadius: wp(2),
        zIndex: 10,
    },
    iconIM: {
        marginRight: wp(2),
    },
    inputIM: {
        flex: 1,
        fontSize: hp(1.8),
        color: '#2D2D2D',
    },
});
