import {Dimensions, StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, ImageBackground } from 'react-native'
import React, { useState, useEffect } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import { StatusBar } from 'expo-status-bar'
import Button from '../components/Button'
import { theme } from '../constants/theme'
import { hp,wp } from '../helpers/common'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getUserInfo } from '../services/userService'
import { getCalendarEvents } from '../services/calendarService'
import { useRouter } from 'expo-router'
import GoogleLoginButton from '../assets/images/google-color.png'
import BackgroundImg from '../assets/images/background-generic-1.png';

WebBrowser.maybeCompleteAuthSession()

const Welcome = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '794159243993-1d44c4nsmehq6hrlg46qc3vrjaq0ohuu.apps.googleusercontent.com',
    iosClientId: '794159243993-frttedg6jh95qulh4eh6ff8090t4018q.apps.googleusercontent.com',
    androidClientId: '794159243993-iafmbeen4qjbe6tsmba1khj7qlsrrd1a.apps.googleusercontent.com',
    scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.readonly']
  });

  const router = useRouter();

  React.useEffect(() => {
    handleSignInWithGoogle();
  }, [response])

  async function handleSignInWithGoogle() {
    if(response?.type === "success"){
      const userData = await getUserInfo(response.authentication.accessToken);
      if (userData) {
        const events = await getCalendarEvents(response.authentication.accessToken);
        await AsyncStorage.setItem("@calendar", JSON.stringify(events));
        router.replace("/home");
      }
    }
  }

  return (
    <ScreenWrapper>
      <StatusBar style='dark' />
      <View style={styles.container}>
        <ImageBackground source={BackgroundImg} style={styles.backgroundImage}>
        <View style={styles.contentContainer}>
          <Text style={styles.welcomeTitle}>Welcome</Text>
          {/* <Text style={styles.appName}>FindMyClass</Text> */}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.googleButton} 
            onPress={() => promptAsync()} 
          >
            <Image 
              source={GoogleLoginButton} 
              style={styles.googleLogo} 
            />
            <Text style={styles.googleButtonText}>CONTINUE WITH GOOGLE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.welcomeButton}
            onPress={() => router.push("/homemap")}
          >
            <Text style={styles.welcomeButtonText}>GET STARTED</Text>
          </TouchableOpacity>

        </View>
        </ImageBackground>
      </View>
    </ScreenWrapper>
  )
}

export default Welcome

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    // width: '100%',
    // height: '100%',
    width:wp(100),
    height: hp(100),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainerStyle: {
    paddingVertical: hp(4),
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: hp(4),

  },
  title: {
    fontSize: hp(3),
    color: theme.colors.dark,
    marginBottom: hp(1),
  },
  appName: {
    fontSize: hp(4),
    fontWeight: 'bold',
    color: theme.colors.dark,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: hp(10),
  },
  button: {
    width: '100%',
  },
  welcomeTitle: {
    fontFamily: 'Odor Mean Chey',
    // fontSize: '340%',
    fontSize: hp(5.7),
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: hp(7),
    marginTop: hp(-4),

  },
  welcomeButton:{
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#912338',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 38,
    borderColor: '#912338',
    borderWidth: 2,
    // width: '95%',
    // height: '125%',
    width: wp(80),
    height: hp(7),
    justifyContent: 'center',
  },
  welcomeButtonText: {
    color: '#F6F1FB',
    fontSize: 15.5,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  calendarContainer: {
    marginVertical: hp(2),
    padding: hp(2),
  },
  sectionTitle: {
    fontSize: hp(2.5),
    fontWeight: 'bold',
    marginBottom: hp(2),
    color: theme.colors.dark,
  },
  eventCard: {
    backgroundColor: '#fff',
    padding: hp(2),
    borderRadius: 10,
    marginBottom: hp(1),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventTitle: {
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.dark,
  },
  eventTime: {
    fontSize: hp(1.8),
    color: theme.colors.black,
    marginTop: hp(0.5),
  },
  userCard: {
    backgroundColor: '#fff',
    padding: hp(2),
    marginHorizontal: hp(2),
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userImage: {
    width: hp(6),
    height: hp(6),
    borderRadius: hp(3),
    marginRight: hp(2),
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: hp(2.2),
    fontWeight: 'bold',
    color: theme.colors.dark,
    marginBottom: hp(0.5),
  },
  userEmail: {
    fontSize: hp(1.8),
    color: theme.colors.black,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 38,
    borderColor: '#EBEAEC',
    borderWidth: 2,
    // width: '95%',
    // height: '125%',
    width: wp(80),
    height: hp(7),
    justifyContent: 'flex-start',
  },
  googleLogo: {
    width: 24,
    height: 24,
    marginRight: 1,
  },
  googleButtonText: {
    color: '#3F414E',
    fontSize: 15.5,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.8,
  },
});