import {StyleSheet, Text, View} from 'react-native';
import React, {useEffect} from 'react';
import {useRouter} from 'expo-router';
import {theme} from "@/constants/theme";
import 'react-native-get-random-values';

const Index = () => {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push('Welcome');
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>ConUMaps</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: theme.colors.white,
        fontSize: 32,
        textAlign: 'center',
        fontWeight: 'bold',
    },
});

export default Index;