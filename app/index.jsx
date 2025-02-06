import { View, Text, Button, Image} from 'react-native';
import React, { useEffect } from 'react'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../components/ScreenWrapper'
import whiteLogo from '../assets/images/logo_whitepage.png'
import styling from '../assets/Styles/mainPageStyle.js'

const index = () => {
    const router = useRouter();

    // This is a timer that shows the index page for 3 seconds before going to the welcome page
    // Can change this later if need less or more time
    useEffect(() => {
    const timer = setTimeout(() => {
      router.push('Welcome');
    }, 3000);
    return () => clearTimeout(timer);
    }, [router]);
    
  return (
    <ScreenWrapper>
      <View style={styling.container}>
        <Image source={whiteLogo} style={styling.logo} />
        {/* <Button title="Welcome" onPress={() => router.push('Welcome')} /> */}
      </View>
    </ScreenWrapper>
  )
}

export default index;