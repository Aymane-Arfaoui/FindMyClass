import React, {useState} from "react";
import {Animated, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {theme} from "@/constants/theme";
import {Ionicons} from "@expo/vector-icons";
import PropTypes from "prop-types";

const categories = [
    {name: "Restaurants", type: "restaurant", icon: "fast-food-outline", mapIcon: "fast-food", color: "gray"},
    {name: "Cafes", type: "cafe", icon: "cafe-outline", mapIcon: "cafe", color: "gray"},
    {name: "ATMs", type: "atm", icon: "card-outline", mapIcon: "card-outline", color: "gray"},
];

export default function PlaceFilterButtons({onSelectCategory}) {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const animation = useState(new Animated.Value(0))[0];

    const handlePress = (category) => {
        const newCategory = selectedCategory === category ? null : category;
        setSelectedCategory(newCategory);
        onSelectCategory(newCategory);
        setExpanded(false);
        Animated.timing(animation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };

    const toggleExpansion = () => {
        Animated.timing(animation, {
            toValue: expanded ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
        setExpanded(!expanded);
    };

    const translateY = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 75],
    });

    const getFilterIcon = () => {
        if (!selectedCategory) return "options-outline";
        const selected = categories.find(cat => cat.type === selectedCategory);
        return selected ? selected.icon : "options-outline";
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.toggleButton} onPress={toggleExpansion}>
                <Ionicons name={expanded ? "close-outline" : getFilterIcon()} size={24} color="white"/>
            </TouchableOpacity>
            {expanded && (
                <Animated.View style={[styles.buttonsWrapper, {transform: [{translateY}]}]}>
                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category.type}
                            style={[
                                styles.button,
                                selectedCategory === category.type && {backgroundColor: category.color},
                            ]}
                            onPress={() => handlePress(category.type)}
                        >
                            <Ionicons
                                name={category.icon}
                                size={20}
                                color={selectedCategory === category.type ? theme.colors.white : theme.colors.dark}
                            />
                            <Text style={[styles.text, selectedCategory === category.type && styles.selectedText]}>
                                {category.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </Animated.View>
            )}
        </View>
    );
}
PlaceFilterButtons.propTypes={
    onSelectCategory:PropTypes.func
}
const styles = StyleSheet.create({
    container: {
        alignItems: "center",
    },
    toggleButton: {
        backgroundColor: theme.colors.blueDark,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 10,
    },
    buttonsWrapper: {
        position: "absolute",
        top: 20,
        left: -65,
        alignItems: "flex-start",
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.white,
        height: 45,
        width: 130,
        borderRadius: theme.radius.md,
        justifyContent: "flex-start",
        paddingHorizontal: 10,
        marginTop: 5,
        shadowColor: theme.colors.dark,
        shadowOffset: {width: 2, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: theme.radius.xs,
        elevation: 4,
    },
    text: {
        color: theme.colors.dark,
        fontSize: 14,
        fontWeight: "bold",
        marginLeft: 8,
    },
    selectedText: {
        color: theme.colors.white,
    },
});
