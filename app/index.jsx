import { View, Text } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../components/ScreenWrapper'
import Button from '../components/Button'
import Loading from '../components/Loading'
import {theme} from "../constants/theme";

const index = () => {
    const router = useRouter();
  return (
    <ScreenWrapper>
      <Text>index File</Text>
      <Button title='Welcome' onPress={() => router.push('/home')} />
        <Button title='Welcome 2' buttonStyle={{ backgroundColor: 'blue', margin: 20 , height: 50, width: '80%', alignSelf: 'center' }}/>
        <Button
            title="Shuttle Schedule"
            onPress={() => router.push('/ShuttleSchedule')}
            buttonStyle={{
                backgroundColor: 'purple',
                margin: 20,
                height: 50,
                width: '80%',
                alignSelf: 'center',
            }}
        />

        {/*<Loading/>*/}
    </ScreenWrapper>
  )
}

export default index