import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, Text } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { Camera } from 'expo-camera';
import {theme} from "@/constants/theme";

const GOOGLE_MAPS_APIKEY = 'AIzaSyA2EELpYVG4YYVXKG3lOXkIcf-ppaIfa80';

const SearchBar = ({ onLocationSelect }) => {
    const [isListening, setIsListening] = useState(false);
    const [recognizedText, setRecognizedText] = useState('');
    const [hasMicrophonePermission, setHasMicrophonePermission] = useState(null);

    const googleRef = useRef(null);

    useEffect(() => {
        checkMicrophonePermission();
    }, []);

    const checkMicrophonePermission = async () => {
        try {
            const {granted} = await ExpoSpeechRecognitionModule.getPermissionsAsync();

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
            const {status} = await Camera.requestMicrophonePermissionsAsync();

            if (status === "granted") {
                setHasMicrophonePermission(true);
            } else {
                Alert.alert(
                    "Microphone Permission Denied",
                    "Please enable microphone access manually in your device settings.",
                    [
                        {text: "Open Settings", onPress: () => Linking.openSettings()},
                        {text: "Cancel", style: "cancel"},
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
            <View style={styles.searchContainer}>
                <GooglePlacesAutocomplete
                    ref={googleRef}
                    placeholder="Search Here"
                    minLength={2}
                    fetchDetails={true}
                    onPress={(data, details = null) => {
                        if (details) {
                            const {lat, lng} = details.geometry.location;
                            onLocationSelect([lng, lat]);
                        }
                    }}
                    query={{
                        key: GOOGLE_MAPS_APIKEY,
                        language: 'en',
                        components: 'country:CA',
                        types: 'establishment',
                    }}
                    styles={{
                        textInputContainer: styles.inputContainer,
                        textInput: styles.textInput,
                    }}
                />
                <TouchableOpacity
                    style={styles.voiceButton}
                    onPress={isListening ? stopVoiceRecognition : startVoiceRecognition}
                >
                    <Ionicons name={isListening ? 'mic-off' : 'mic'} size={24} color="white"/>
                </TouchableOpacity>
            </View>
        </View>
    );
};
    const styles = StyleSheet.create({
        container: {
            backgroundColor: 'transparent',
            marginTop: 10,
            paddingHorizontal: 10,

        },
        searchContainer: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            backgroundColor: 'transparent',
            borderRadius: 50,
            paddingRight: 5, // Add spacing between input and button
        },
        inputContainer: {
            flex: 1,
        },
        textInput: {
            height: 53,
            fontSize: 16,
            borderRadius: 50,
            backgroundColor: 'white',
            paddingHorizontal: 15,
            flex: 1,
            elevation: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.7,
            shadowRadius: 4,
        },
        voiceButton: {
            backgroundColor: theme.colors.blueDark,
            padding: 15,
            borderRadius: 50,
            marginLeft: 5,
            elevation: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.7,
            shadowRadius: 4,
        },
    });


export default SearchBar;
