import { View, Text, Button, Image, Animated } from 'react-native';
import React, { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../components/ScreenWrapper'
import whiteLogo from '../assets/images/logo_whitepage.png'
import styling from '../assets/Styles/mainPageStyle.js'

const index = () => {
    const router = useRouter();
    
    // EXTRA feature: fade-in animation
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
      // Fade-in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      // Fade-out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      // This is a timer that shows the index page for 3 seconds before going to the welcome page
      // Can change this later if need less or more time
      setTimeout(() => {
        router.push('Welcome');
      }, 1100); // fade-out duration from index
    }, 3000);

    return () => clearTimeout(timer);
    }, [fadeAnim, router]);
    
  return (
    <ScreenWrapper>
      <View style={styling.container}>
        {/* <Image source={whiteLogo} style={styling.logo} /> */}
        <Animated.Image 
          source={whiteLogo} 
          style={[styling.logo, { opacity: fadeAnim }]} 
        />
        {/* <Button title="Welcome" onPress={() => router.push('Welcome')} /> */}
      </View>
    </ScreenWrapper>
  )
}

export default index;