import React, { useContext } from 'react';
import { SafeAreaView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { ThemeContext } from '@/context/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const Settings = () => {
    const router = useRouter();
    const { isDark, toggleTheme, colorBlindMode, toggleColorBlindMode, theme } = useContext(ThemeContext);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.colors.cardBorder }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
            </View>

            <View style={styles.settingsList}>
                {/* Dark Mode */}
                <View style={[styles.settingCard, { backgroundColor: theme.colors.settingsCardBackground, borderColor: theme.colors.cardBorder }]}>
                    <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Dark Mode</Text>
                    <Switch
                        value={isDark}
                        onValueChange={toggleTheme}
                        trackColor={{ false: theme.colors.gray, true: theme.colors.primary }}
                        thumbColor={isDark ? '#fff' : '#f4f3f4'}
                    />
                </View>

                {/* Color Blind Mode */}
                <View style={[styles.settingCard, { backgroundColor: theme.colors.settingsCardBackground, borderColor: theme.colors.cardBorder }]}>
                    <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Color Blind Mode</Text>
                    <Switch
                        value={colorBlindMode}
                        onValueChange={toggleColorBlindMode}
                        trackColor={{ false: theme.colors.gray, true: theme.colors.primary }}
                        thumbColor={colorBlindMode ? '#fff' : '#f4f3f4'}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingVertical: 20,
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    settingsList: {
        marginTop: 20,
    },
    settingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    settingTitle: {
        fontSize: 18,
    },
});

export default Settings;
