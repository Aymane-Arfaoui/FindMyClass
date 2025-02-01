import { StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import { StatusBar } from 'expo-status-bar'
import Button from '../components/Button'
import { theme } from '../constants/theme'
import { hp } from '../helpers/common'

const Welcome = () => {
  return (
    <ScreenWrapper>
      <StatusBar style='dark' />
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Welcome to</Text>
          <Text style={styles.appName}>FindMyClass</Text>
        </View>
        <View style={styles.buttonContainer}>
          <Button 
            title="Get Started" 
            onPress={() => {}} 
            buttonStyle={styles.button}
          />
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default Welcome

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: hp(4),
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  button: {
    width: '100%',
  },
});