import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserLocation } from '@/services/userService';
import { theme } from "@/constants/theme";

const LiveLocationButton = ({ onPress }) => {
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
            <Ionicons name="locate" size={28} color={theme.colors.white} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    liveLocationButton: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        backgroundColor: theme.colors.blueDark,
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 10,
    },
});

export default LiveLocationButton;
