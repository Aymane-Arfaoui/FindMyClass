import { StyleSheet, Text, View, Image, ScrollView } from 'react-native'
import React from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import { StatusBar } from 'expo-status-bar'
import Button from '../components/Button'
import { theme } from '../constants/theme'
import { hp } from '../helpers/common'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'

const Home = () => {
  const [userInfo, setUserInfo] = React.useState(null);
  const [calendarEvents, setCalendarEvents] = React.useState([]);
  const router = useRouter();

  React.useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const user = await AsyncStorage.getItem("@user");
    if (user) {
      setUserInfo(JSON.parse(user));
    }
    const events = await AsyncStorage.getItem("@calendar");
    if (events) {
      setCalendarEvents(JSON.parse(events));
    }
  };

  const handleSignOut = async () => {
    await AsyncStorage.multiRemove(["@user", "@calendar"]);
    router.replace("/");
  };

  return (
    <ScreenWrapper>
      <StatusBar style='dark' />
      <ScrollView 
        contentContainerStyle={styles.contentContainerStyle}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.appName}>FindMyClass</Text>
          <Button 
            title="Sign Out" 
            onPress={handleSignOut}
            buttonStyle={styles.signOutButton}
            textStyle={styles.signOutText}
          />
        </View>
        
        {userInfo && (
          <>
            <View style={styles.userCard}>
              {userInfo.picture && (
                <Image 
                  source={{ uri: userInfo.picture }} 
                  style={styles.userImage}
                />
              )}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userInfo.name}</Text>
                <Text style={styles.userEmail}>{userInfo.email}</Text>
              </View>
            </View>

            <View style={styles.calendarContainer}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              {calendarEvents.map((event, index) => (
                <View key={index} style={styles.eventCard}>
                  <Text style={styles.eventTitle}>{event.summary}</Text>
                  <Text style={styles.eventTime}>
                    {new Date(event.start?.dateTime || event.start?.date).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  )
}

export default Home

const styles = StyleSheet.create({
  // ... copy existing styles from Welcome.jsx ...
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
    paddingHorizontal: hp(2),
  },
  signOutButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: hp(2),
  },
  signOutText: {
    color: theme.colors.dark,
  }
}); 