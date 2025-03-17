import React, {useCallback, useEffect, useState} from 'react';
import {Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {theme} from "@/constants/theme";
import Config from 'react-native-config';
import debounce from 'lodash.debounce';
import {ExpoSpeechRecognitionModule, useSpeechRecognitionEvent} from 'expo-speech-recognition';

const GOOGLE_PLACES_API_KEY = Config.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places:autocomplete";

const MainSearchBar = ({onLocationSelect, onBuildingPress}) => {
    const [inputText, setInputText] = useState('');
    const [predictions, setPredictions] = useState([]);
    const [sessionToken, setSessionToken] = useState(generateSessionToken());
    const [isListening, setIsListening] = useState(false);
    const [hasMicrophonePermission, setHasMicrophonePermission] = useState(null);


    useEffect(() => {
        setSessionToken(generateSessionToken());
        checkMicrophonePermission();
    }, []);

    function generateSessionToken() {
        return Math.random().toString(36).substring(2, 15);
    }

    const checkMicrophonePermission = async () => {
        try {
            const {granted} = await ExpoSpeechRecognitionModule.getPermissionsAsync();
            setHasMicrophonePermission(granted);
            if (!granted) requestMicrophonePermission();
        } catch (error) {
            Alert.alert("❌ Permission check error:", error.toString());
        }
    };

    const requestMicrophonePermission = async () => {
        try {
            const {status} = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            setHasMicrophonePermission(status === "granted");
        } catch (error) {
            Alert.alert("❌ Permission request error:", error.toString());
        }
    };

    useSpeechRecognitionEvent("result", (event) => {
        if (event.results && event.results.length > 0) {
            const text = event.results[0].transcript;
            setInputText(text);
            fetchPredictions(text);
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
        } catch (error) {
            setIsListening(false);

        }
    };

    const fetchPredictions = async (text) => {
        if (!text) {
            setPredictions([]);
            return;
        }
        try {
            const response = await fetch(GOOGLE_PLACES_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
                    'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text'
                },
                body: JSON.stringify({
                    input: text,
                    sessionToken: sessionToken,
                    includedPrimaryTypes: ["establishment"],
                    locationBias: {
                        circle: {
                            center: {latitude: 45.5017, longitude: -73.5673},
                            radius: 10000
                        }
                    }
                })
            });
            const data = await response.json();
            setPredictions(data.suggestions || []);
        } catch (error) {

        }
    };

    const debouncedFetchPredictions = useCallback(debounce(fetchPredictions, 500), []);

    const clearInput = () => {
        setInputText('');
        setPredictions([]);
    };

    const handlePlaceSelect = async (selectedItem) => {
        const placeId = selectedItem?.placePrediction?.placeId;
        const placeText = selectedItem?.placePrediction?.text?.text || "";

        if (!placeId) {
            Alert.alert("Error", "Could not retrieve location details.");
            return;
        }


        setInputText(placeText);
        setPredictions([]);

        try {
            const placeDetailsUrl = `https://places.googleapis.com/v1/places/${placeId}?key=${GOOGLE_PLACES_API_KEY}&fields=location,displayName,formattedAddress`;

            const response = await fetch(placeDetailsUrl);
            const result = await response.json();


            if (result?.error) {
                Alert.alert("Error", `Google API Error: ${result.error.message}`);
                return;
            }

            if (result?.location?.latitude && result?.location?.longitude) {
                const {latitude, longitude} = result.location;
                onLocationSelect([longitude, latitude]);

                if (onBuildingPress) {
                    const building = {
                        name: result?.displayName?.text || "Unknown Location",
                        textPosition: [longitude, latitude],
                    };
                    onBuildingPress(building, longitude, latitude);
                }
            } else {
                Alert.alert("Error", "Could not retrieve full location details.");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to fetch place details.");
        }
    };


    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={theme.colors.grayDark} style={styles.searchIcon}/>
                <TextInput
                    style={styles.textInput}
                    placeholder="Search Here"
                    value={inputText}
                    onChangeText={(text) => {
                        setInputText(text);
                        debouncedFetchPredictions(text);
                    }}
                />
                {inputText.length > 0 ? (
                    <TouchableOpacity style={styles.closeButton} onPress={clearInput}>
                        <Ionicons name="close-circle" size={22} color={theme.colors.grayDark}/>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.micButton} onPress={startVoiceRecognition}>
                        <Ionicons name={isListening ? "mic-off" : "mic"} size={22} color={theme.colors.grayDark}/>
                    </TouchableOpacity>
                )}
            </View>
            <FlatList
                data={predictions}
                keyExtractor={(item) => item.placePrediction.placeId}
                renderItem={({item}) => (
                    <TouchableOpacity style={styles.suggestionRow} onPress={() => handlePlaceSelect(item)}>
                        <Text style={styles.descriptionText}>{item.placePrediction.text.text}</Text>
                    </TouchableOpacity>
                )}
                style={styles.listView}
            />
        </View>
    );
};

export default MainSearchBar;


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        borderRadius: 25,
        paddingLeft: 40,
        paddingRight: 45,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    textInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: theme.colors.black,
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
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray,
        backgroundColor: theme.colors.white,
    },
    descriptionText: {
        fontSize: 14,
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
        zIndex: 10,
    },
    closeButton: {
        position: "absolute",
        right: 15,
        top: 14,
        zIndex: 10,
    },
});

