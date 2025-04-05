import { Dimensions, StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, ImageBackground, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../constants/theme';
import { hp, wp } from '../helpers/common';
import { getUserInfo } from '../services/userService';
import { getCalendarEvents } from '../services/calendarService';
import { useRouter } from 'expo-router';
import {Ionicons} from "@expo/vector-icons";
import AppNavigationPanel from "@/components/AppNavigationPannel";
import BackgroundImg from '../assets/images/background-generic-1.png';
import UserProfileIcon from '../assets/images/profile_icon.png';
// import SettingsCog from '../assets/images/settings_cog.png';

const User = () => {
  const router = useRouter();

  return (
      <ScreenWrapper>

        <View>
          <ImageBackground testID={'welcome-background-image'} source={BackgroundImg} style={styles.backgroundImage}/>
          {/* <Text>PLESD WOKR</Text> */}
            {/* Header with Profile and Settings Icon */}
            <View style={styles.header}>
            <View style={styles.profileContainer}>
              <Image source={UserProfileIcon} style={styles.profileIcon} />
                      <Text style={styles.welcomeText}>Welcome back,</Text>
                      {/* <Text style={styles.userName}>{userInfo.given_name}</Text> */}
                      <Text style={styles.userName}>John Doe</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/settings')}>
              {/*<Image source={SettingsCog} style={styles.settingsIcon} />*/}
            </TouchableOpacity>
          </View>
          {/* Today's Schedule Block */}
          <View style={styles.scheduleBlock}>
            <Text style={styles.blockTitle}>Today's Schedule</Text>
            <Text style={styles.scheduleText}>No events for today!</Text>
          </View>
          {/* Calendar Block */}
          <View style={styles.calendarBlock}>
            <Text style={styles.blockTitle}>Calendar</Text>
            {/* Placeholder for Calendar (you can add a calendar component here) */}
            <Text style={styles.scheduleText}>Your calendar events will appear here.</Text>
          </View>
        </View>


        <AppNavigationPanel />
    </ScreenWrapper>
  );
};

export default User;

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: wp(100),
    height: hp(100),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    resizeMode: 'cover',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingTop: 40, // Space from the top
    paddingBottom: 20, // Space for better UI separation
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  settingsIcon: {
    width: 30,
    height: 30,
  },
  scheduleBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Light background for the block
    padding: 15,
    marginTop: 20,
    borderRadius: 10,
  },
  calendarBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Light background for the block
    padding: 15,
    marginTop: 20,
    borderRadius: 10,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scheduleText: {
    fontSize: 14,
    color: theme.colors.darkGray,
  },
  welcomeText: {
    fontSize: hp(1.8),
    color: theme.colors.dark,
    opacity: 0.7,
  },
  userName: {
    fontSize: hp(2.4),
    fontWeight: 'bold',
    color: theme.colors.dark,
  },
});