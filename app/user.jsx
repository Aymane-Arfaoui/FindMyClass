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
import SettingsCog from '../assets/images/settings_cog.png';

const User = () => {
  const router = useRouter();

  return (
      <ScreenWrapper>
        
        <View style={styles.container}>
          <ImageBackground testID={'welcome-background-image'} source={BackgroundImg} style={styles.backgroundImage}/>
            {/*This is where the user info should be added*/}
            {/* {userInfo && (
              <> */}
            <View style={styles.header}>
            <View style={styles.profileContainer}>
              <Image source={UserProfileIcon} style={styles.profileIcon} />
              <View style={styles.textContainer}>
                      <Text style={styles.welcomeText}>Welcome back</Text>
                      {/* <Text style={styles.userName}>{userInfo.given_name}</Text> */}
                      <Text style={styles.userName}>John Doe</Text>
                      </View>
            </View>
            <TouchableOpacity testID={'settings-button'} onPress={() => router.push('/settingsPage')}>
              <Image source={SettingsCog} style={styles.settingsIcon} />
            </TouchableOpacity>
          </View>

            {/* Calendar Block */}
                <View style={styles.calendarBlock}>
                  <TouchableOpacity
                      onPress={() => router.push("/calendar")}
                      testID={'calendar-button'}
                  >
                    <View style={styles.actionIconContainer}>
                      <Ionicons name="calendar" size={24} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.blockTitle}>Calendar</Text>
                    {/* add {todayEvents.length} for implementation*/}
                    <Text style={styles.scheduleText}>2 events today</Text>
                  </TouchableOpacity>
                </View>          


              {/* Today's Schedule Block */}
        <View style={styles.scheduleBlock}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.blockTitle}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => router.push('/calendar')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

            {/* Add the events dynamically here
            hardcoded for now */}
            <View style={styles.scheduleItem}>
              <View style={styles.eventRow}>
                <Text style={styles.scheduleTime}>10:00AM</Text>
                <Text style={styles.scheduleSubject}>Mitderm exam</Text>
              </View>
            </View>
            {/* remvoe this once the full implementation is done */}
            <View style={styles.scheduleItem}>
              <View style={styles.eventRow}>
                <Text style={styles.scheduleTime}>12:00PM</Text>
                <Text style={styles.scheduleSubject}>Meeting with team</Text>
              </View>
            </View>
        </View>
           {/* </>
          )} */}
        
                  {/* // This is the implementation for the signout button
                  {userInfo && (
                      <View style={styles.bottomContainer}>
                        <TouchableOpacity onPress={handleSignOut} testID={'button'} style={styles.signOutButton}>
                          <View style={styles.signOutContainer}>
                            <Ionicons name="log-out-outline" size={24} color="#fff" />
                            <Text style={styles.signOutText}>Sign Out</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                  )} */}

            </View>
        <AppNavigationPanel />
    </ScreenWrapper>
  );
};

export default User;

const styles = StyleSheet.create({
  quickActions: {
    flexDirection: 'row',
    marginBottom: hp(3),
  },
  actionIconContainer: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: theme.colors.lightPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  actionTitle: {
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.dark,
    marginBottom: hp(0.5),
  },
  actionSubtitle: {
    fontSize: hp(1.6),
    color: theme.colors.dark,
    opacity: 0.7,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
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
    justifyContent: 'center',
  },
  textContainer: {
    flexDirection: 'column', 
    marginLeft: 10, 
  },
  profileIcon: {
    width: wp(20),
    height: hp(10),
    resizeMode:'contain',
    marginRight: '12%',
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
    backgroundColor: 'rgba(255, 255, 255, 0.7)', 
    padding: 15,
    marginTop: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgb(231, 231, 231) ',
    width: '90%',
  },
  scheduleHeader: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center', 
    width: '100%',
    marginBottom: 10,
  },
  eventRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  seeAllContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  scheduleItem: {
    marginTop: 10,
  },
  scheduleTime: {
    fontSize: 14,
    color: theme.colors.darkGray,
  },
  scheduleSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.dark,
    textDecorationLine: 'underline', // Underlines the subject text
    width: '65%',  // Adjust the width to allow enough space for subject
    flexWrap: 'wrap',  // Allow text to wrap within the container
  },
  calendarBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Light background for the block
    padding: 15,
    marginTop: hp(5),
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgb(231, 231, 231) ',
    width: '40%',
    marginLeft: wp(-45),
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