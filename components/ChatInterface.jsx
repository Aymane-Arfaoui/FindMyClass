import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatService } from '../services/chatService';
import { ThemeContext } from '@/context/ThemeProvider';
import { formatDateToLocalDate } from '@/helpers/utils';

const ChatInterface = ({ navigation, initialMessage }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRouteModalVisible, setIsRouteModalVisible] = useState(false);
  const [recentRoutePlan, setRecentRoutePlan] = useState(null);
  const flatListRef = useRef(null);
  const { isDark, theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const currentDate = formatDateToLocalDate(new Date());

  // Load chat history on mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5001/chat/history', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (data.messages) {
          setMessages(data.messages);
          const routePlan = data.messages
              .filter(msg => msg.type === "route_plan")
              .slice(-1)[0];
          setRecentRoutePlan(routePlan ? routePlan.text : null);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        setMessages([
          {
            id: '1',
            text: 'Hi! I can help with your tasks and schedule, or provide indoor directions. What would you like to know?',
            isUser: false,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    };

    fetchChatHistory();

    if (initialMessage) {
      try {
        const parsedMessage = typeof initialMessage === 'string' ? JSON.parse(initialMessage) : initialMessage;
        setMessages(prev => [...prev, parsedMessage]);
        if (parsedMessage.type === "route_plan") {
          setRecentRoutePlan(parsedMessage.text);
        }
      } catch (error) {
        console.error('Error parsing initial message:', error);
      }
    }
  }, [initialMessage]);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date().toISOString()
    };

    // Send user message to backend
    try {
      await fetch('http://127.0.0.1:5001/chat/add_message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage })
      });
    } catch (error) {
      console.error('Error saving user message to backend:', error);
    }

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await chatService.processMessage(userMessage.text, currentDate);

      const botMessage = {
        id: `bot-${Date.now()}`,
        text: response.content || response.response || response,
        isUser: false,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
      if (botMessage.text.includes("Here’s your optimized route plan")) {
        setRecentRoutePlan(botMessage.text);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage = {
        id: `error-${Date.now()}`,
        text: "Sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.isUser;

    const formattedText = item.text.split('\n').map((line, index) => (
        <Text key={index} style={[
          styles.messageText,
          isUser ? styles.userText : styles.botText
        ]}>
          {line}
        </Text>
    ));

    return (
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.botBubble
        ]}>
          {formattedText}
        </View>
    );
  };

  return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack ? navigation.goBack() : navigation.navigate('/')}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assistant</Text>
          {recentRoutePlan && (
              <TouchableOpacity
                  style={styles.routeButton}
                  onPress={() => setIsRouteModalVisible(true)}
              >
                <Ionicons name="map" size={24} color={theme.colors.primary} />
                <Text style={styles.routeButtonText}>View Route Plan</Text>
              </TouchableOpacity>
          )}
        </View>

        <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
        />

        {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
        )}

        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={100}
            style={styles.inputContainer}
        >
          <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about your tasks or directions..."
              placeholderTextColor={theme.colors.grayDark}
              multiline
              onSubmitEditing={handleSend}
              returnKeyType="send"
              blurOnSubmit={Platform.OS === 'ios'}
          />
          <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={24} color={inputText.trim() ? theme.colors.white : theme.colors.gray} />
          </TouchableOpacity>
        </KeyboardAvoidingView>

        <Modal
            visible={isRouteModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsRouteModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Route Plan</Text>
                <TouchableOpacity onPress={() => setIsRouteModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalContent}>
                {recentRoutePlan ? (
                    recentRoutePlan.split('\n').map((line, index) => (
                        <Text key={index} style={styles.modalText}>
                          {line}
                        </Text>
                    ))
                ) : (
                    <Text style={styles.modalText}>No route plan available.</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    elevation: 3,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  routeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: theme.colors.grayLight,
    borderRadius: 8,
  },
  routeButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    marginVertical: 8,
    maxWidth: '80%',
    minWidth: 60,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: theme.colors.cardBackground,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginVertical: 2,
  },
  userText: {
    color: theme.colors.white,
  },
  botText: {
    color: theme.colors.text,
  },
  loadingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 80,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: theme.colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    color: theme.colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.grayLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  modalContent: {
    flex: 1,
  },
  modalText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 8,
  },
});

export default ChatInterface;