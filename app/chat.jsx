import React, { useContext, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeContext } from '@/context/ThemeProvider';
import ChatInterface from '@/components/ChatInterface';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function ChatScreen() {
    const { isDark } = useContext(ThemeContext);
    const router = useRouter();
    const { initialMessage, selectedTasks } = useLocalSearchParams();

    const [initialMessages, setInitialMessages] = useState([]);

    useEffect(() => {
        if (initialMessage) {
            try {
                const parsedMessage = JSON.parse(initialMessage);
                setInitialMessages([parsedMessage]);
            } catch (error) {
                console.error("Error parsing initial message:", error);
                setInitialMessages([
                    { id: '1', text: 'Hi! I can help with your tasks and schedule, or provide indoor directions. What would you like to know?', isUser: false }
                ]);
            }
        } else {
            setInitialMessages([
                { id: '1', text: 'Hi! I can help with your tasks and schedule, or provide indoor directions. What would you like to know?', isUser: false }
            ]);
        }
    }, [initialMessage]);

    return (
        <>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ChatInterface
                navigation={{ goBack: () => router.back() }}
                initialMessages={initialMessages}
                selectedTasks={selectedTasks ? JSON.parse(selectedTasks) : []}
            />
        </>
    );
}