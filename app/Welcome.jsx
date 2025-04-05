import {
    ActivityIndicator,
    Image,
    ImageBackground,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import React, {useContext, useEffect, useMemo, useState} from 'react';
import {StatusBar} from 'expo-status-bar';
import {hp, wp} from '@/helpers/common';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getUserInfo} from '@/services/userService';
import {useRouter} from 'expo-router';
import GoogleLoginButton from '../assets/images/google-color.png';
import {ThemeContext} from '@/context/ThemeProvider';
import DarkBackgroundImg from "@/assets/images/BackgroundDark.png";
import LightBackgroundImg from "@/assets/images/background-generic-1.png";
import * as calendarService from '@/services/calendarService';


WebBrowser.maybeCompleteAuthSession();

const Welcome = () => {
    const {isDark, theme} = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: '794159243993-frttedg6jh95qulh4eh6ff8090t4018q.apps.googleusercontent.com',
    androidClientId: '449179918461-habdo22us8rjk9mc8si9mpgulhec5iao.apps.googleusercontent.com',
    scopes: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.events.readonly',
      'https://www.googleapis.com/auth/calendar.settings.readonly',
      'https://www.googleapis.com/auth/calendar.calendarlist.readonly'
    ],
    redirectUri: 'com.aymanearfaoui.findmyclass:/oauth2redirect'
  });

  const router = useRouter();
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    handleSignInWithGoogle();
  }, [response]);

  async function handleSignInWithGoogle() {
    if (response?.type === "success") {
      setLoading(true);
      try {
        const userData = await getUserInfo(response.authentication.accessToken);
        if (userData) {
          await AsyncStorage.setItem("@accessToken", response.authentication.accessToken);
          router.replace("/home");
        }
      } catch (error) {
        console.error('Sign in error:', error);
      } finally {
        setLoading(false);
      }
    }
  }


    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            await promptAsync();
        } catch (error) {
            console.error('Authentication error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: isDark ? '#757575' : '#FAF8F5'}}>
            <StatusBar style={isDark ? 'light' : 'dark'}/>
            <View style={styles.container} testID={'welcome'}>
                <ImageBackground testID={'welcome-background-image'}
                                 source={isDark ? DarkBackgroundImg : LightBackgroundImg}
                                 style={styles.backgroundImage}>

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
                            testID={'welcome-button'}
                            style={styles.welcomeButton}
                            onPress={() => router.push("/homemap")}
                        >
                            <Text style={styles.welcomeButtonText}>GET STARTED</Text>
                        </TouchableOpacity>

                    </View>


                </ImageBackground>

                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={theme.colors.primary}/>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const createStyles = (theme) => StyleSheet.create({
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
        backgroundColor: theme.colors.background,
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
        color: theme.colors.text,
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
        backgroundColor: theme.colors.cardBackground,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 38,
        borderColor: theme.colors.cardBorder,
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
        color: theme.colors.text,
        fontSize: 15.5,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
        letterSpacing: 0.8,
    },

    welcomeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 38,
        borderColor: theme.colors.primary,
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
        backgroundColor: theme.colors.loadingoverlay,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
});
export default Welcome;