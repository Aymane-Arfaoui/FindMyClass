import React, { useState } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity, SafeAreaView } from 'react-native';
import { theme } from '../constants/theme';  // Assuming you have a theme object
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const Settings = () => {
    const router = useRouter();

    // Functionality of the buttons
    const [darkMode, setDarkMode] = useState(false); // State for Dark Mode
    const [colorBlindMode, setColorBlindMode] = useState(false); // State for Color Blind Mode

    const toggleDarkMode = () => setDarkMode(previousState => !previousState);
    const toggleColorBlindMode = () => setColorBlindMode(previousState => !previousState);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Dark Mode Setting */}
      <View style={styles.settingContainer}>
        <Text style={styles.settingTitle}>Dark Mode</Text>
        <Switch
          value={darkMode}
          onValueChange={toggleDarkMode}
          trackColor={{ false: '#767577', true: theme.colors.primary }}
          thumbColor={darkMode ? theme.colors.white : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
        />
      </View>

      {/* Color Blind Mode Setting */}
      <View style={styles.settingContainer}>
        <Text style={styles.settingTitle}>Color Blind Mode</Text>
        <Switch
          value={colorBlindMode}
          onValueChange={toggleColorBlindMode}
          trackColor={{ false: '#767577', true: theme.colors.primary }}
          thumbColor={colorBlindMode ? theme.colors.white : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
        />
      </View>
    </SafeAreaView>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,  // Background color of the settings page
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 15,
    borderBottomWidth: 1, 
    borderBottomColor: '#d1d1d1',
  },
  backButton: {
    marginRight: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text, 
  },
  settingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border, 
  },
  settingTitle: {
    fontSize: 18,
    color: theme.colors.text,
  },
});
