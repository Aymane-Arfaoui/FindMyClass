import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatService } from '../app/services/chatService';
import { ThemeContext } from '@/context/ThemeProvider';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ChatInterface = ({ navigation }) => {
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hi! I can help with your tasks and schedule, or provide indoor directions. What would you like to know?', isUser: false }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);
  const { isDark, theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const dotAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnimation, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      dotAnimation.setValue(0);
    }
  }, [isLoading]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      const response = await chatService.processMessage(userMessage.text);
      
      // Ensure loading shows for at least 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: response.content || response.response || response,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change or loading state changes
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isLoading]);

  const renderMessage = (message) => {
    const isUser = message.isUser;
    
    // Convert line breaks to properly render in text
    const formattedText = message.text.split('\n').map((line, index) => (
      <Text key={index} style={[
        styles.messageText,
        isUser ? styles.userText : styles.botText
      ]}>
        {line}
      </Text>
    ));
    
    return (
      <View key={message.id} style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.botBubble
      ]}>
        {formattedText}
      </View>
    );
  };

  const renderLoadingDots = () => {
    const dot1Opacity = dotAnimation.interpolate({
      inputRange: [0, 0.3, 0.6, 1],
      outputRange: [0.3, 1, 0.3, 0.3]
    });
    const dot2Opacity = dotAnimation.interpolate({
      inputRange: [0, 0.3, 0.6, 1],
      outputRange: [0.3, 0.3, 1, 0.3]
    });
    const dot3Opacity = dotAnimation.interpolate({
      inputRange: [0, 0.3, 0.6, 1],
      outputRange: [0.3, 0.3, 0.3, 1]
    });

    return (
      <View style={styles.loadingDotsContainer}>
        <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
        <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
        <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
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
      </View>
      
      <View style={styles.contentContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(message => renderMessage(message))}
        </ScrollView>
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            {renderLoadingDots()}
          </View>
        )}
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputWrapper}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about your tasks or directions..."
            placeholderTextColor={theme.colors.grayDark}
            multiline
            maxLength={1000}
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
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
    left: 16,
    bottom: 90,
    zIndex: 1,
  },
  loadingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 20,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginHorizontal: 4,
  },
  inputWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: SCREEN_HEIGHT - 100,
    backgroundColor: theme.colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
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
});

export default ChatInterface; 