import React, { useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeContext } from '@/context/ThemeProvider';
import ChatInterface from '@/components/ChatInterface';
import { useRouter } from 'expo-router';

export default function ChatScreen() {
  const { isDark } = useContext(ThemeContext);
  const router = useRouter();
  
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ChatInterface navigation={{ goBack: () => router.back() }} />
    </>
  );
} 