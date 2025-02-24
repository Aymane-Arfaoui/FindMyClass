import React, {useRef} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import {Ionicons} from '@expo/vector-icons';
import {theme} from "@/constants/theme";
import Config from 'react-native-config';
const GOOGLE_PLACES_API_KEY=Config.GOOGLE_PLACES_API_KEY;

const SearchBar = ({onLocationSelect, onBuildingPress}) => {
    const googleRef = useRef(null);
    return (
        <View style={styles.container}>
            <GooglePlacesAutocomplete
                ref={googleRef}
                placeholder="Search Here"
                minLength={2}
                fetchDetails={true}
                onPress={(data, details = null) => {
                    if (details) {
                        const {lat, lng} = details.geometry.location;
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
                    container: styles.autocompleteContainer,
                    textInputContainer: styles.inputContainer,
                    textInput: styles.textInput,
                    listView: styles.listView,
                    row: styles.suggestionRow,
                    description: styles.descriptionText,
                    poweredContainer: styles.poweredContainer,
                }}
                renderRow={(data) => (
                    <View style={styles.suggestionItem}>
                        <Ionicons name="location-outline" size={20} color={theme.colors.grayDark}
                                  style={styles.locationIcon}/>
                        <Text style={styles.suggestionText}>{data.description}</Text>
                    </View>
                )}
                enablePoweredByContainer={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
        paddingHorizontal: 10,
        paddingTop: 10,
        zIndex: 5,
    },
    autocompleteContainer: {
        flex: 1,
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
        paddingHorizontal: 20,
        borderWidth: 0,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    listView: {
        backgroundColor: theme.colors.white,
        borderRadius: 10,
        marginTop: 5,
        paddingHorizontal: 10,
        elevation: 5,
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
});

export default SearchBar;