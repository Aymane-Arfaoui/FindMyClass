import React, {useContext, useMemo, useState} from 'react';
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
import PropTypes from "prop-types";
import {ThemeContext} from "@/context/ThemeProvider";


const IndoorSearchBar = ({ navigation, setSelectedFloorKey, setSelectedSection, resetTransform }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchActive, setSearchActive] = useState(false);
    const { theme } = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);

    const handleSearch = (query) => {
        setSearchQuery(query);

        if (!query) {
            setSearchResults([]);
            setSearchActive(false);
            return;
        }

        const results = getMatchingSectionsFromFloors(query);
        setSearchResults(results);
        setSearchActive(true);
    };

    const getMatchingSectionsFromFloors = (query) => {
        const results = [];
        const lowerQuery = query.toLowerCase();

        for (const buildingKey of Object.keys(floorsData)) {
            const buildingFloors = floorsData[buildingKey];

            for (const floorKey of Object.keys(buildingFloors)) {
                const { sections } = buildingFloors[floorKey];

                const matches = findMatchingSections(sections, lowerQuery, buildingKey, floorKey);
                results.push(...matches);
            }
        }

        return results;
    };

    const findMatchingSections = (sections, lowerQuery, buildingKey, floorKey) => {
        return sections
            .filter(section => section.id.toLowerCase().includes(lowerQuery))
            .map(section => ({
                id: section.id,
                buildingKey,
                floorKey,
                section,
            }));
    };


    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setSearchActive(false);
        setSelectedSection(null);  // Remove selection
        resetTransform();  // Reset zoom and position
    };

    const getSectionCenter = (section) => {
        if (!section?.d) return null;

        try {
            const numbers = section.d.match(/[-+]?\d*\.?\d+/g)?.map(Number) || [];
            if (numbers.length < 4) return null;

            const xValues = numbers.filter((_, index) => index % 2 === 0);
            const yValues = numbers.filter((_, index) => index % 2 !== 0);

            if (xValues.length === 0 || yValues.length === 0) return null;

            const minX = Math.min(...xValues);
            const maxX = Math.max(...xValues);
            const minY = Math.min(...yValues);
            const maxY = Math.max(...yValues);

            return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
        } catch (error) {
            console.error("Error calculating section center:", error);
            return null;
        }
    };

    const handleSelectSearchResult = (result) => {
        setSelectedFloorKey(result.floorKey);
        setSelectedSection(result.section);
        setSearchQuery(result.id);
        setSearchResults([]);
        setSearchActive(false);

        const sectionCenter = getSectionCenter(result.section);

        if (sectionCenter) {
            resetTransform(sectionCenter);
        }

        navigation.navigate("MapScreen", {
            buildingKey: result.buildingKey,
            floorKey: result.floorKey,
            section: result.section
        });
    };


    return (
        <View style={styles.searchBarWrapper}>
            <Ionicons name="search" size={20} color={theme.colors.dark} style={styles.searchIcon} />
            <TextInput
                style={styles.searchInput}
                placeholder="Search Here"
                placeholderTextColor={theme.colors.grayDark}
                returnKeyType="search"
                value={searchQuery}
                onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton} testID="clear-button">
                    <Ionicons name="close-circle" size={20} color={theme.colors.grayDark} />
                </TouchableOpacity>
            )}
            {searchActive && searchResults.length > 0 && (
                <ScrollView style={styles.searchResultsContainer}>
                    {searchResults.map((result, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.searchResultItem}
                            onPress={() => handleSelectSearchResult(result)}
                        >
                            <Text style={styles.searchResultText}>
                                {result.id} - {result.buildingKey}, Floor {result.floorKey}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
};
IndoorSearchBar.propTypes={
    navigation: PropTypes.any,
    setSelectedFloorKey: PropTypes.func,
    setSelectedSection: PropTypes.func,
    resetTransform: PropTypes.func
}
export default IndoorSearchBar;

const createStyles = (theme) => StyleSheet.create({
    searchBarWrapper: {
        position: "absolute",
        top: 60,
        left: 50,
        right: 16,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.backgroundNav,
        borderRadius: theme.radius.xl,
        paddingHorizontal: 12,
        height: 44,
        shadowColor: theme.colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: theme.radius.sm,
        elevation: 5,
        width: 330,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: theme.colors.text,
    },
    clearButton: {
        padding: 5,
        marginLeft: 5,
    },
    searchResultsContainer: {
        position: "absolute",
        top: 55,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.backgroundNav,
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
    searchResultItem: {
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: theme.colors.backgroundNav,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.line,
    },
    searchResultText: {
        fontSize: 16,
        color: theme.colors.text,
        fontWeight: theme.fonts.medium,
    },
    searchResultItemTouchable: {
        borderRadius: theme.radius.md,
        overflow: "hidden",
    },
});
