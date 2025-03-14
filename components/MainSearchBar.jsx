import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';
import { theme } from "@/constants/theme";
import Config from 'react-native-config';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

const GOOGLE_PLACES_API_KEY = Config.GOOGLE_PLACES_API_KEY;

const MainSearchBar = ({ onLocationSelect, onBuildingPress }) => {
    const [isListening, setIsListening] = useState(false);
    const [recognizedText, setRecognizedText] = useState('');
    const [hasMicrophonePermission, setHasMicrophonePermission] = useState(null);
    const [inputText, setInputText] = useState('');
    const googleRef = useRef(null);

    useEffect(() => {
        checkMicrophonePermission();
    }, []);

    const checkMicrophonePermission = async () => {
        try {
            const { granted } = await ExpoSpeechRecognitionModule.getPermissionsAsync();
            setHasMicrophonePermission(granted);
            if (!granted) requestMicrophonePermission();
        } catch (error) {
            Alert.alert("❌ Permission check error:", error);
        }
    };

    const requestMicrophonePermission = async () => {
        try {
            const { status } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            setHasMicrophonePermission(status === "granted");
        } catch (error) {
            Alert.alert("❌ Permission request error:", error);
        }
    };

    useSpeechRecognitionEvent("result", (event) => {
        if (event.results && event.results.length > 0) {
            const text = event.results[0].transcript;
            setRecognizedText(text);
            googleRef?.current?.setAddressText(text);
            setInputText(text);
        }
    });

    useSpeechRecognitionEvent("end", () => setIsListening(false));

    const startVoiceRecognition = async () => {
        if (!hasMicrophonePermission) {
            Alert.alert("Permission Required", "Microphone access is needed for voice search.");
            return;
        }

        try {
            setIsListening(true);
            ExpoSpeechRecognitionModule.start({
                lang: "en-US",
                interimResults: false,
                maxAlternatives: 1,
            });

            setTimeout(() => setIsListening(false), 5000);
        } catch (error) {
            setIsListening(false);
        }
    };

    const clearInput = () => {
        setInputText('');
        googleRef?.current?.setAddressText('');
    };

    return (
        <View style={styles.searchContainer}>
            <GooglePlacesAutocomplete
                ref={googleRef}
                placeholder="Search Here"
                minLength={2}
                fetchDetails={true}
                textInputProps={{
                    clearButtonMode: 'never',
                    onChangeText: (text) => setInputText(text),
                    value: inputText,
                }}
                onPress={(data, details = null) => {
                    if (details) {
                        const { lat, lng } = details.geometry.location;
                        onLocationSelect([lng, lat]);
                        if (onBuildingPress) {
                            const building = {
                                name: details.name || data.description,
                                textPosition: [lng, lat],
                            };
                            onBuildingPress(building, lng, lat);
                        }
                    }
                }}
                query={{
                    key: GOOGLE_PLACES_API_KEY,
                    language: 'en',
                    components: 'country:CA',
                    types: 'establishment',
                }}
                styles={{
                    container: { flex: 1 },
                    textInputContainer: styles.inputContainer,
                    textInput: styles.textInput,
                    listView: styles.listView,
                    row: styles.suggestionRow,
                    description: styles.descriptionText,
                    poweredContainer: styles.poweredContainer,
                }}
                renderLeftButton={() => (
                    <Ionicons name="search-outline" size={20} color={theme.colors.grayDark} style={styles.searchIcon} />
                )}
                renderRightButton={() =>
                    inputText.length > 0 ? (
                        <TouchableOpacity style={styles.closeButton} onPress={clearInput}>
                            <Ionicons name="close-circle" size={22} color={theme.colors.grayDark} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.micButton} onPress={startVoiceRecognition}>
                            <Ionicons name={isListening ? "mic-off" : "mic"} size={22} color={theme.colors.grayDark} />
                        </TouchableOpacity>
                    )
                }
                enablePoweredByContainer={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        zIndex: 100,
        paddingHorizontal: 0,
        top: 4,
    },

    inputContainer: {
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        borderBottomWidth: 0,
    },

    textInput: {
        height: 50,
        fontSize: 16,
        borderRadius: 25,
        backgroundColor: theme.colors.white,
        paddingLeft: 40,
        paddingRight: 45,
        borderWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
        color: theme.colors.black,
        placeholderTextColor: theme.colors.grayDark,
    },

    searchIcon: {
        position: "absolute",
        left: 15,
        top: 14,
        zIndex: 10,
    },

    micButton: {
        position: "absolute",
        right: 15,
        top: 14,
        zIndex: 100,
    },

    closeButton: {
        position: "absolute",
        right: 15,
        top: 14,
        zIndex: 10,
    },

    listView: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.white,
        borderRadius: 10,
        marginTop: 5,
        paddingHorizontal: 10,
        elevation: 10,
        zIndex: 500,
        maxHeight: 200,
    },

    suggestionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
    },

    descriptionText: {
        fontSize: 14,
    },

    poweredContainer: {
        display: 'none',
    },
});

export default MainSearchBar;