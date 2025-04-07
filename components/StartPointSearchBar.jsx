import React, {useContext, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {floorsData} from "@/constants/floorData";
import {Ionicons} from "@expo/vector-icons";
import {hp, wp} from "@/helpers/common";

import PropTypes from 'prop-types';
import {ThemeContext} from "@/context/ThemeProvider";

const StartPointSearchBar = ({
                                 navigation,
                                 resetTransform,
                                 searchQuery,
                                 setSearchQuery,

                             }) => {
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

        if (!query) {
            setSearchResults([]);
            setSearchActive(false);
            return;
        }

        const results = getMatchingStartLocations(query);
        setSearchResults(results);
        setSearchActive(true);
    };

    const getMatchingStartLocations = (query) => {
        const results = [];
        const lowerQuery = query.toLowerCase();

        for (const buildingKey of Object.keys(floorsData)) {
            const buildingFloorsSP = floorsData[buildingKey];

            for (const floorKey of Object.keys(buildingFloorsSP)) {
                const { sections } = buildingFloorsSP[floorKey];

                const matches = findSections(sections, lowerQuery, buildingKey, floorKey);
                results.push(...matches);
            }
        }

        return results;
    };

    const findSections = (sections, lowerQuery, buildingKey, floorKey) => {
        return sections
            .filter(section => section.id.toLowerCase().includes(lowerQuery))
            .map(section => ({
                id: section.id,
                buildingKey,
                floorKey,
                section,
            }));
    };



    const {theme} = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);
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
            <Ionicons name="radio-button-on" size={16} color={theme.colors.primary} style={styles.sPSearchIcon}/>

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
                    <Ionicons name="close-circle" size={20} color={theme.colors.grayDark}/>
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

StartPointSearchBar.propTypes = {
    navigation: PropTypes.object,
    resetTransform: PropTypes.func,
    searchQuery: PropTypes.string,
    setSearchQuery: PropTypes.func,
};

export default StartPointSearchBar;

const createStyles = (theme) => StyleSheet.create({
    sPSearchBarWrapper: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.white,
        borderRadius: wp(4),
        paddingHorizontal: wp(3),
        paddingVertical: hp(1),
        elevation: 2,
        shadowColor: theme.colors.shadow || '#000',
        shadowOffset: {width: 0, height: hp(0.3)},
        shadowOpacity: 0.1,
        shadowRadius: wp(2),
        zIndex: 10,
    },

    sPSearchInput: {
        flex: 1,
        fontSize: hp(1.8),
        color: theme.colors.gray,
    },

    sPSearchIcon: {
        marginRight: wp(2),
    },

    sPClearButton: {
        padding: wp(1),
        marginLeft: wp(1),
    },
    sPSearchResultsContainer: {
        position: "absolute",
        top: hp(5.5),
        left: 0,
        right: 0,
        backgroundColor: theme.colors.white,
        borderRadius: wp(3),
        paddingVertical: hp(1),
        shadowColor: theme.colors.shadow || '#000',
        shadowOffset: {width: 0, height: hp(0.3)},
        shadowOpacity: 0.15,
        shadowRadius: wp(2),
        elevation: 5,
        maxHeight: hp(30),
        zIndex: 20,
        borderWidth: 1,
        borderColor: theme.colors.gray,
    },
    sPSearchResultItem: {
        paddingVertical: hp(1.2),
        paddingHorizontal: wp(4),
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray,
    },
    sPSearchResultText: {
        fontSize: hp(1.7),
        color: theme.colors.gray,
        fontWeight: '500',
    },
});

