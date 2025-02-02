import { View, Text } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../components/ScreenWrapper';
import Button from '../components/Button';

const HomeScreen = () => {
    const router = useRouter();

    return (
        <ScreenWrapper>
            <Text>Welcome Page</Text>
            <Button title='Go Back' onPress={() => router.back()} />
        </ScreenWrapper>
    );
};

export default HomeScreen;
