import {StyleSheet, Text, View, Image, ScrollView, TouchableOpacity} from 'react-native'
import React from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import { StatusBar } from 'expo-status-bar'
import Button from '../components/Button'
import { theme } from '../constants/theme'
import { hp } from '../helpers/common'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import {fetchBuildingCoordinates} from "@/services/routeService";
import {Ionicons} from "@expo/vector-icons";
import Calendar from "@/components/Calendar";
import AppNavigationPanel from "@/components/AppNavigationPannel";

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

  const handleClassSelect = async (event) => {
    try {
      const location = event.location;
      const buildingCode = location?.split('-')[0];
      const room = location?.split(' ')[location?.split(' ').length - 1]; // Extract room number
      if (buildingCode) {
        const coordinates = await fetchBuildingCoordinates(buildingCode);
        if (coordinates) {
          router.push(`/homemap?lat=${coordinates.latitude}&lng=${coordinates.longitude}&room=${room}`);
        }
      }
    } catch (error) {
      console.error('Error selecting class:', error);
    }
  };

  const todayEvents = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.start?.dateTime || event.start?.date).toISOString().split('T')[0];
      return eventDate === today;
    });
  }, [calendarEvents]);

  return (
      <ScreenWrapper>
        <StatusBar style='dark' />
        <ScrollView contentContainerStyle={styles.contentContainerStyle} style={styles.container}>
          {userInfo && (
              <>
                <View style={styles.header}>
                  <View style={styles.userCard} testID={'user-card'}>
                    {userInfo.picture && (
                        <Image testID={'user-picture'} source={{ uri: userInfo.picture }} style={styles.userImage} />
                    )}
                    <View style={styles.userInfo}>
                      <Text style={styles.welcomeText}>Welcome back,</Text>
                      <Text style={styles.userName}>{userInfo.given_name}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.quickActions}>
                  <TouchableOpacity
                      style={styles.actionCard}
                      onPress={() => router.push("/calendar")}
                      testID={'calendar-button'}
                  >
                    <View style={styles.actionIconContainer}>
                      <Ionicons name="calendar" size={24} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.actionTitle}>Calendar</Text>
                    <Text style={styles.actionSubtitle}>{todayEvents.length} events today</Text>
                  </TouchableOpacity>
                </View>

                <Calendar events={calendarEvents} onClassSelect={handleClassSelect}  />
              </>
          )}
          {userInfo && (
              <View style={styles.bottomContainer}>
                <TouchableOpacity onPress={handleSignOut} testID={'button'} style={styles.signOutButton}>
                  <View style={styles.signOutContainer}>
                    <Ionicons name="log-out-outline" size={24} color="#fff" />
                    <Text style={styles.signOutText}>Sign Out</Text>
                  </View>
                </TouchableOpacity>
              </View>
          )}
        </ScrollView>

        <AppNavigationPanel />
      </ScreenWrapper>

  )
}

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainerStyle: {
    padding: hp(2),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  quickActions: {
    flexDirection: 'row',
    marginBottom: hp(3),
  },
  actionCard: {
    backgroundColor: '#fff',
    padding: hp(2),
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    width: '48%',
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
  bottomContainer: {
    padding: hp(2),
    paddingBottom: hp(8),
    // backgroundColor: '#fff',
    // borderTopWidth: 1,
    // borderTopColor: theme.colors.lightGray,
  },
  signOutButton: {
    backgroundColor: theme.colors.primary,
    padding: hp(1.5),
    paddingHorizontal: hp(4),
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    marginLeft: hp(1),
    fontSize: hp(1.8),
    color: '#fff',
    fontWeight: '600',
  },
});