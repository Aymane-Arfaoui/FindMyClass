import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';
import { theme } from "@/constants/theme";
import Config from 'react-native-config';

import React, { useState, useEffect, useRef } from 'react';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { Camera } from 'expo-camera';

const GOOGLE_PLACES_API_KEY = Config.GOOGLE_PLACES_API_KEY;

const SearchBar = ({ onLocationSelect, onBuildingPress }) => {

    const [isListening, setIsListening] = useState(false);
    const [recognizedText, setRecognizedText] = useState('');
    const [hasMicrophonePermission, setHasMicrophonePermission] = useState(null);
    const googleRef = useRef(null);



    useEffect(() => {
        checkMicrophonePermission();
    }, []);

    const checkMicrophonePermission = async () => {
        try {
            const { granted } = await ExpoSpeechRecognitionModule.getPermissionsAsync();

            if (granted) {
                setHasMicrophonePermission(true);
            } else {
                requestMicrophonePermission();
            }
        } catch (error) {
            Alert.alert("❌ Permission check error:", error);
        }
    };

    const requestMicrophonePermission = async () => {
        try {
            const { status } = await Camera.requestMicrophonePermissionsAsync();

            if (status === "granted") {
                setHasMicrophonePermission(true);
            } else {
                Alert.alert(
                    "Microphone Permission Denied",
                    "Please enable microphone access manually in your device settings.",
                    [
                        { text: "Open Settings", onPress: () => Linking.openSettings() },
                        { text: "Cancel", style: "cancel" },
                    ]
                );
                setHasMicrophonePermission(false);
            }
        } catch (error) {
            Alert.alert("❌ Permission request error:", error);
        }
    };

    useSpeechRecognitionEvent("result", (event) => {
        if (event.results && event.results.length > 0) {
            const text = event.results[0].transcript;
            setRecognizedText(text);

            googleRef?.current?.setAddressText(text);
        }
    });

    useSpeechRecognitionEvent("end", () => {
        setIsListening(false);
    });

    useSpeechRecognitionEvent("error", (event) => {
        setIsListening(false);
        Alert.alert("Error", "Failed to recognize speech. Please try again.");
    });

    const startVoiceRecognition = async () => {
        if (!hasMicrophonePermission) {
            Alert.alert("Permission Required", "Microphone access is needed for voice search.");
            return;
        }

        try {
            setIsListening(true);

            ExpoSpeechRecognitionModule.start({
                lang: "en-US",
                interimResults: true,
                maxAlternatives: 1,
                continuous: true,
            });


            setTimeout(() => {
                stopVoiceRecognition();
            }, 5000);

        } catch (error) {
            setIsListening(false);
        }
    };


    const stopVoiceRecognition = async () => {
        try {
            await ExpoSpeechRecognitionModule.stop();
        } catch (error) {
        }
        setIsListening(false);
    };


    return (
        <View style={styles.container}>
            <View style={styles.autocompleteContainer}>
                <GooglePlacesAutocomplete
                    ref={googleRef}
                    placeholder="Search Here"
                    minLength={2}
                    fetchDetails={true}
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
                    enablePoweredByContainer={false}
                />
            </View>
            <TouchableOpacity
                style={styles.voiceButton}
                onPress={isListening ? stopVoiceRecognition : startVoiceRecognition}
            >
                <Ionicons name={isListening ? 'mic-off' : 'mic'} size={24} color="white" />
            </TouchableOpacity>
        </View>
    );

};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        paddingTop: 10,
        zIndex: 100,
        paddingHorizontal: 10,
    },
    autocompleteContainer: {
        flex: 1,
        position: "relative",
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
        paddingHorizontal: 40,
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
        top: 15,
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
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    locationIcon: {
        marginRight: 10,
    },
    suggestionText: {
        fontSize: 14,
        flexShrink: 1,
        maxWidth: '85%',
    },
    descriptionText: {
        fontSize: 14,
    },
    poweredContainer: {
        display: 'none',
    },
    voiceButton: {
        backgroundColor: theme.colors.blueDark,
        padding: 15,
        borderRadius: 50,
        elevation: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.7,
        shadowRadius: 4,
        marginLeft: 10,
    },
});



export default SearchBar;