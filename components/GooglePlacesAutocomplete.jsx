import React, {useCallback, useContext, useEffect, useMemo, useState} from "react";
import {FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import Config from "react-native-config";
import debounce from "lodash.debounce";
import PropTypes from "prop-types";
import {ThemeContext} from "@/context/ThemeProvider";

const GOOGLE_PLACES_API_KEY = Config.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_URL = "https://places.googleapis.com/v1/places:autocomplete";

const GooglePlacesAutocomplete = ({address, onAddressSelect, autoFocus}) => {
    const { theme } = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);
    const [inputText, setInputText] = useState(address || "");
    const [predictions, setPredictions] = useState([]);
    const [sessionToken] = useState(generateSessionToken());
    const [showList, setShowList] = useState(false);

    useEffect(() => {
        setInputText(address || "");
    }, [address]);

    function generateSessionToken() {
        return Math.random().toString(36).substring(2, 15);
    }

    const fetchPredictions = async (text) => {
        if (!text) {
            setPredictions([]);
            setShowList(false);
            return;
        }

        try {
            const response = await fetch(GOOGLE_PLACES_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
                    "X-Goog-FieldMask": "suggestions.placePrediction.placeId,suggestions.placePrediction.text",
                },
                body: JSON.stringify({
                    input: text,
                    sessionToken: sessionToken,
                    includedPrimaryTypes: ["establishment"],
                    locationBias: {
                        circle: {
                            center: {latitude: 45.5017, longitude: -73.5673},
                            radius: 10000,
                        },
                    },
                }),
            });

            const data = await response.json();
            setPredictions(data.suggestions || []);
            setShowList(data.suggestions.length > 0);
        } catch (error) {
            console.error("Error fetching address suggestions:", error);
        }
    };

    const debouncedFetchPredictions = useCallback(debounce(fetchPredictions, 500), []);

    const handleAddressSelect = (selectedItem) => {
        const placeText = selectedItem?.placePrediction?.text?.text || "";
        setInputText(placeText);
        setPredictions([]);
        setShowList(false);

        if (onAddressSelect) {
            onAddressSelect(placeText);
        }
    };

    const handleClearInput = () => {
        setInputText("");
        setPredictions([]);
        setShowList(false);
    };

    return (
        <View style={styles.googleAutoInputContainer}>
            <TextInput
                style={styles.googleAutoInput}
                value={inputText}
                onChangeText={(text) => {
                    setInputText(text);
                    debouncedFetchPredictions(text);
                }}
                placeholder="Enter Address"
                autoFocus={autoFocus} // Ensure input gets focus
            />

            {inputText.length > 0 && (
                <TouchableOpacity style={styles.googleAutoClearButton} onPress={handleClearInput}>
                    <Ionicons name="close-circle" size={20} color={theme.colors.grayDark}/>
                </TouchableOpacity>
            )}

            {showList && (
                <View style={styles.googleAutoSuggestionsContainer}>
                    <FlatList
                        data={predictions}
                        keyExtractor={(item) => item.placePrediction.placeId}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({item}) => (
                            <TouchableOpacity
                                style={styles.googleAutoSuggestionItem}
                                onPress={() => handleAddressSelect(item)}
                            >
                                <Text style={styles.googleAutoSuggestionText}>
                                    {item.placePrediction.text.text}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}
        </View>

    );
};

const createStyles = (theme) => StyleSheet.create({
    googleAutoInputContainer: {
        position: "relative",
    },
    googleAutoInput: {
        backgroundColor: theme.colors.inputBackground,
        borderWidth: 1,
        borderColor: theme.colors.gray,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        fontSize: 16,
        color: theme.colors.text,
    },
    googleAutoClearButton: {
        position: "absolute",
        right: 10,
        top: "50%",
        transform: [{translateY: -10}],
        padding: 0,
    },
    googleAutoSuggestionsContainer: {
        position: "absolute",
        top: 50,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.cardBackground,
        borderRadius: 10,
        elevation: 5,
        zIndex: 1000,
        maxHeight: 230,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
    },
    googleAutoSuggestionItem: {
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray,
    },
    googleAutoSuggestionText: {
        fontSize: 16,
        color: theme.colors.text,
    },
});


GooglePlacesAutocomplete.propTypes = {
    address: PropTypes.string,
    onAddressSelect: PropTypes.func,
    autoFocus: PropTypes.bool,
};

export default GooglePlacesAutocomplete;
