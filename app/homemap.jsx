import React from 'react';
import { StyleSheet, View, StatusBar, Platform } from 'react-native';
import Map from '../components/Map';

const Homemap = () => {
    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content"/>
            <Map />
        </View>
    );
};

export default Homemap;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight, // Ensure full-screen map
    },
});
