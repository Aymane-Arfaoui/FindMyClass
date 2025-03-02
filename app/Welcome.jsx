import { Dimensions, StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, ImageBackground, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../constants/theme';
import { hp, wp } from '../helpers/common';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserInfo } from '../services/userService';
import { getCalendarEvents } from '../services/calendarService';
import { useRouter } from 'expo-router';
import GoogleLoginButton from '../assets/images/google-color.png';
import BackgroundImg from '../assets/images/background-generic-1.png';

WebBrowser.maybeCompleteAuthSession();

const Welcome = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '794159243993-1d44c4nsmehq6hrlg46qc3vrjaq0ohuu.apps.googleusercontent.com',
    iosClientId: '794159243993-frttedg6jh95qulh4eh6ff8090t4018q.apps.googleusercontent.com',
    androidClientId: '382767299119-lsn33ef80aa3s68iktbr29kpdousi4l4.apps.googleusercontent.com',
    scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.readonly'],
    redirectUri: 'com.aymanearfaoui.findmyclass:/oauth2redirect'
  });

  const router = useRouter();
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    handleSignInWithGoogle();
  }, [response]);

  async function handleSignInWithGoogle() {
    if (response?.type === "success") {
      setLoading(true); // Show loading while processing
      const userData = await getUserInfo(response.authentication.accessToken);
      if (userData) {
        const events = await getCalendarEvents(response.authentication.accessToken);
        await AsyncStorage.setItem("@calendar", JSON.stringify(events));
        router.replace("/home");
      }
      setLoading(false); // Hide loading after processing
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true); // Show loading when starting authentication
    try {
      await promptAsync();
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setLoading(false); // Hide loading on error or completion
    }
  };

  return (
      <ScreenWrapper>
        <StatusBar style='dark' />
        <View style={styles.container} testID={'welcome'}>
          <ImageBackground testID={'welcome-background-image'} source={BackgroundImg} style={styles.backgroundImage}>
            <View style={styles.contentContainer} testID={'welcome-title'}>
              <Text style={styles.welcomeTitle}>Welcome</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                  testID={'Google-login'}
                  style={styles.googleButton}
                  onPress={handleGoogleSignIn}
                  disabled={isLoading}
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
              testID={'open-map-button'}
              style={styles.mapButton}
              onPress={() => router.push('/MapScreen')}
              disabled={isLoading}
            >
              <Text style={styles.mapButtonText}>OPEN INDOOR MAPS</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
};

export default Welcome;

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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: hp(4),
  },
  welcomeTitle: {
    fontFamily: 'Odor Mean Chey',
    fontSize: hp(5.7),
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: hp(7),
    marginTop: hp(-4),
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: hp(10),
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
welcomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#912338',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 38,
    borderColor: '#912338',
    borderWidth: 2,
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
  mapButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 38,
    width: wp(80),
    height: hp(7),
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});