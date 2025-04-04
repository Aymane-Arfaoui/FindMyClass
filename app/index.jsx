import { View, Animated } from 'react-native';
import React, { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../components/ScreenWrapper'
import whiteLogo from '../assets/images/logo_whitepage.png'
import styling from '../assets/Styles/mainPageStyle.js'
import 'react-native-get-random-values';

const Index = () => {
    const router = useRouter();
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      // This is a timer that shows the index page for 3 seconds before going to the welcome page
      // Can change this later if need less or more time
      setTimeout(() => {
        router.push('Welcome');
      }, 1100);
    }, 3000);

    return () => clearTimeout(timer);
    }, [fadeAnim, router]);
    
  return (
    <ScreenWrapper>
      <View style={styling.container}>
        <Animated.Image
            testID={'index-image'}
          source={whiteLogo} 
          style={[styling.logo, { opacity: fadeAnim }]} 
        />
      </View>
    </ScreenWrapper>
  )
}

export default Index;