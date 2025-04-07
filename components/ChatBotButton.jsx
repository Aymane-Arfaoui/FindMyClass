import React, {useContext, useMemo} from 'react';
import {StyleSheet, TouchableOpacity} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import { useRouter } from 'expo-router'
import PropTypes from 'prop-types';
import {ThemeContext} from "@/context/ThemeProvider";

const ChatBotButton = ({onPress}) => {
    const { theme } = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);
    const router = useRouter();

    return (
            <TouchableOpacity style={styles.chatbotButton} onPress={() => router.push('chat')}>
                <Ionicons name="chatbubbles" size={30} color="white"/>
            </TouchableOpacity>
    );
};

const createStyles = (theme) =>
    StyleSheet.create({
        chatbotButton: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        backgroundColor: theme.colors.primary,
        borderRadius: 50,
        padding: 13,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
ChatBotButton.propTypes={
    onPress:PropTypes.func
}
export default ChatBotButton;