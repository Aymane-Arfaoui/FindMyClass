import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { floorsData } from "@/constants/floorData";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { parse, getBounds } from 'svg-path-bounds';
import {hp} from "@/helpers/common";


const StartPointSearchBar = ({ navigation,
                                 // setSelectedFloorKey,
                                 // setSelectedSection,
                                 resetTransform,
                                 searchQuery,
                                 setSearchQuery,

                             }) => {
    // const [searchQuery, setSearchQuery] = useState('');
    const [searchActive, setSearchActive] = useState(false);
    const [searchResults, setSearchResults] = useState([]);


    const handleClearSearchStartLocation = () => {
        setSearchQuery('');
        setSearchResults([]);
        setSearchActive(false);
        // setSelectedSection(null);
        resetTransform();
    };

    const handleSearchStartLocation = (query) => {
        setSearchQuery(query);
        let results = [];

        if (!query) {
            setSearchResults([]);
            setSearchActive(false);
            return;
        }

        Object.keys(floorsData).forEach((buildingKey) => {
            const buildingFloorsSP = floorsData[buildingKey];

            Object.keys(buildingFloorsSP).forEach((floorKey) => {
                const { sections } = buildingFloorsSP[floorKey];

                sections.forEach((section) => {
                    if (section.id.toLowerCase().includes(query.toLowerCase())) {
                        results.push({
                            id: section.id,
                            buildingKey,
                            floorKey,
                            section,
                        });
                    }
                });
            });
        });

        setSearchResults(results);
        setSearchActive(true);
    };



    const handleSelectSearchResultStartLocation = (result) => {
        // setSelectedFloorKey(result.floorKey);
        // setSelectedSection(result.section);
        setSearchQuery(result.id);
        setSearchResults([]);
        setSearchActive(false);

        // const sectionCenter = getSectionCenter(result.section);
        //
        // if (sectionCenter) {
        //     resetTransform(sectionCenter);
        // }

        resetTransform();

        navigation.navigate("MapScreen", {
            buildingKey: result.buildingKey,
            floorKey: result.floorKey,
            section: result.section
        });
    };


    return (
        <View style={styles.sPSearchBarWrapper}>
            <Ionicons name="radio-button-on" size={16} color={theme.colors.primary} style={styles.sPSearchIcon} />
            {/*    <Ionicons name="radio-button-on" size={16} color={theme.colors.primary} style={styles.iconIM}/>*/}

            <TextInput
                style={styles.sPSearchInput}
                placeholder="Search Here"
                placeholderTextColor={theme.colors.grayDark}
                returnKeyType="search"
                value={searchQuery}
                onChangeText={handleSearchStartLocation}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClearSearchStartLocation} style={styles.sPClearButton}>
                    <Ionicons name="close-circle" size={20} color={theme.colors.grayDark} />
                </TouchableOpacity>
            )}
            {searchActive && searchResults.length > 0 && (
                <ScrollView style={styles.sPSearchResultsContainer}>
                    {searchResults.map((result, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.sPSearchResultItem}
                            onPress={() => handleSelectSearchResultStartLocation(result)}
                        >
                            <Text style={styles.sPSearchResultText}>
                                {result.id} - {result.buildingKey}, Floor {result.floorKey}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

export default StartPointSearchBar;

const styles = StyleSheet.create({
    sPSearchBarWrapper: {
        // position: "absolute",
        // top: 60,
        // left: 50,
        // right: 16,
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.white,
        borderRadius: theme.radius.xl,
        paddingHorizontal: 12,
        height: 35,
        // shadowColor: theme.colors.text,
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.2,
        // shadowRadius: theme.radius.sm,
        // elevation: 5,
        // width: 330,
        zIndex: 10,

    },
    sPSearchIcon: {
        marginRight: 8,
    },
    sPSearchInput: {
        flex: 1,
        // fontSize: 16,
        color: theme.colors.dark,
        fontSize: hp(1.8),

    },
    sPClearButton: {
        padding: 5,
        marginLeft: 5,
    },
    sPSearchResultsContainer: {
        position: "absolute",
        top: 55,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.white,
        borderRadius: theme.radius.lg,
        paddingVertical: 8,
        shadowColor: theme.colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: theme.radius.sm,
        elevation: 5,
        maxHeight: 250,
        zIndex: 20,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: theme.colors.gray,
    },
    sPSearchResultItem: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray,
    },
    sPSearchResultText: {
        fontSize: 16,
        color: theme.colors.dark,
        fontWeight: theme.fonts.medium,
    },
    searchResultItemTouchable: {
        borderRadius: theme.radius.md,
        overflow: "hidden",
    },
});
