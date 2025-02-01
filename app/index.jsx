import { View, Text } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../components/ScreenWrapper'
import Button from '../components/Button'
import Loading from '../components/Loading'

const index = () => {
    const router = useRouter();
  return (
    <ScreenWrapper>
      <Text>index File</Text>
      <Button title='Welcome' onPress={() => router.push('welcome')} />
      {/*<Loading/>*/}
    </ScreenWrapper>
  )
}

export default index