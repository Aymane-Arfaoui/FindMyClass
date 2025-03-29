import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

const SectionPanel = ({ selectedSection, onClose, panHandlers, panelY, onShowDirections, onShowDirectionsTemp  }) => {
    if (!selectedSection) return null;

    return (
        <Animated.View testID={'section-panel'}
                       {...panHandlers}
                       style={[styles.panelContainer, { transform: [{ translateY: panelY }] }]}
        >

            <View style={styles.dragBar} />

            <View style={styles.panelContent}>
                <Text style={styles.sectionTitle}>{selectedSection?.id || 'N/A'}</Text>
                {/*<Text style={styles.sectionTitle}>{selectedSection?.id || 'N/A'}</Text>*/}

                <TouchableOpacity onPress={onClose} style={styles.closeButton} testID={'close-section-button'}>
                    <Ionicons name="close-circle" size={32} color={theme.colors.dark} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.directionsButton}
                    // onPress={onShowDirections}
                    onPress={() => {
                        onShowDirections();
                        onShowDirectionsTemp();
                    }}
                >
                    <Text style={styles.directionsButtonText}>Show Directions</Text>
                </TouchableOpacity>


            </View>
        </Animated.View>
    );
};
// SectionPanel.propTypes={
//     selectedSection: PropTypes.any,
//     onClose: PropTypes.func,
//     panHandlers: PropTypes.any,
//     panelY: PropTypes.object
// }

export default SectionPanel;

const styles = StyleSheet.create({
    panelContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: theme.radius.xxl,
        borderTopRightRadius: theme.radius.xxl,
        padding: 20,
        paddingBottom: 25,
        shadowColor: theme.colors.dark,
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 8,
    },
    dragBar: {
        width: 40,
        height: 5,
        backgroundColor: theme.colors.grayDark,
        borderRadius: 3,
        alignSelf: "center",
        marginBottom: 15,
        marginTop: -5,
        opacity: 0.6,
    },
    panelContent: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.dark,
    },
    sectionDetails: {
        fontSize: 14,
        color: theme.colors.textLight,
        marginTop: 5,
    },
    closeButton: {
        position: 'absolute',
        right: 0,
        top: -42,
        backgroundColor: theme.colors.white,
        borderRadius: 20,
        padding: 5,
        shadowColor: theme.colors.dark,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
        zIndex: 10,
    },

    directionsButton: {
        marginTop: 15,
        backgroundColor: theme.colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: theme.radius.md,
        alignSelf: 'flex-start',
    },

    directionsButtonText: {
        fontSize: 16,
        color: theme.colors.white,
        fontWeight: 'bold',
    },

});
