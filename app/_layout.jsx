import { View, Text } from 'react-native'
import React from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { AuthProvider, useAuth } from '../context/auth'

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading) {
      const inAuthGroup = segments[0] === "(auth)";
      if (user && !inAuthGroup) {
        router.replace("/homemap");
      } else if (!user && inAuthGroup) {
        router.replace("/");
      }
    }
  }, [user, loading]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <AuthProvider testID={'root-layout'}>
      <RootLayoutNav />
    </AuthProvider>
  );
}