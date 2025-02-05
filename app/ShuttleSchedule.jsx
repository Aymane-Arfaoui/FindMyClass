import { View, Text } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../components/ScreenWrapper';
import Button from '../components/Button';

const ShuttleSchedule = () => {
    const router = useRouter();
    return (
        <ScreenWrapper>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Shuttle Schedule</Text>
            <Button title="Go Home" onPress={() => router.push('/')} />
        </ScreenWrapper>
    );
};

export default ShuttleSchedule;
