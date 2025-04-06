import React, {useContext, useMemo} from 'react';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import PropTypes from 'prop-types';
import {ThemeContext} from '@/context/ThemeProvider';
import {hp, wp} from '@/helpers/common';

const SectionPanel = ({
                          selectedSection,
                          onClose,
                          panHandlers,
                          panelY,
                          onShowDirections,
                          onShowDirectionsTemp,
                          showButtonDirections,
                          multiFloorText
                      }) => {
    const {theme} = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);

    if (!selectedSection) return null;

    const showText = multiFloorText !== "";

    return (
        <Animated.View
            testID={'section-panel'}
            {...panHandlers}
            style={[styles.panelContainer, {transform: [{translateY: panelY}]}]}
        >
            <View style={styles.dragBar}/>

            <View style={styles.panelContent}>
                <Text style={styles.sectionTitle}>{selectedSection?.id || 'N/A'}</Text>

                <TouchableOpacity onPress={onClose} style={styles.closeButtonSP_in} testID={'close-section-button'}>
                    <Ionicons name="close-circle" size={28} color={theme.colors.text}/>
                </TouchableOpacity>

                {showText && (
                    <View style={styles.multiFloorRow}>
                        <Ionicons name="warning" size={18} color={theme.colors.warning || theme.colors.primary}
                                  style={styles.warningIcon}/>
                        <Text style={styles.multiFloorText}>{multiFloorText}</Text>
                    </View>
                )}

                {showButtonDirections && (
                    <TouchableOpacity
                        style={styles.directionsButton}
                        onPress={() => {
                            onShowDirections();
                            onShowDirectionsTemp();
                        }}
                    >
                        <Ionicons name="navigate" size={22} color={theme.colors.white}/>
                    </TouchableOpacity>
                )}
            </View>
        </Animated.View>
    );
};

SectionPanel.propTypes = {
    selectedSection: PropTypes.object,
    onClose: PropTypes.func,
    panHandlers: PropTypes.object,
    panelY: PropTypes.object,
    onShowDirections: PropTypes.func,
    onShowDirectionsTemp: PropTypes.func,
    showButtonDirections: PropTypes.bool,
    multiFloorText: PropTypes.string,
};

export default SectionPanel;
const createStyles = (theme) => StyleSheet.create({
    panelContainer: {
        position: 'absolute',
        bottom: -10,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.cardBackground,
        borderTopLeftRadius: wp(6),
        borderTopRightRadius: wp(6),
        padding: hp(2.5),
        paddingBottom: hp(3),
        shadowColor: theme.colors.shadow || '#000',
        shadowOffset: {width: 0, height: -3},
        shadowOpacity: 0.12,
        shadowRadius: 6,
    },
    dragBar: {
        width: wp(10),
        height: hp(0.6),
        backgroundColor: theme.colors.grayDark,
        borderRadius: wp(3),
        alignSelf: "center",
        marginBottom: hp(2),
        opacity: 0.5,
    },
    panelContent: {
        position: 'relative',
        paddingBottom: hp(1.5),
    },
    sectionTitle: {
        fontSize: hp(2.2),
        fontWeight: 'bold',
        color: theme.colors.text,
        marginLeft: wp(1),
    },
    closeButtonSP_in: {
        position: 'absolute',
        right: -10,
        top: -50,
        backgroundColor: theme.colors.cardSecondary,
        borderRadius: wp(5),
        padding: wp(1),
        shadowColor: theme.colors.shadow || '#000',
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 6,
        zIndex: 10,
    },
    directionsButton: {
        position: 'absolute',
        right: 0,
        top: -hp(2),
        width: 45,
        height: 45,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.shadow || '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 4,
        marginRight: wp(5),
    },
    multiFloorRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: hp(1),
        paddingRight: wp(6),
    },

    warningIcon: {
        marginRight: wp(2),
        marginTop: hp(0.3),
    },

    multiFloorText: {
        fontSize: hp(1.7),
        color: theme.colors.warning || theme.colors.text,
        flex: 1,
        lineHeight: hp(2.3),
    },

});
