import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { theme } from "@/constants/theme";

const categories = [
    { name: "Restaurants", type: "restaurant" },
    { name: "Cafes", type: "cafe" },
    { name: "ATMs", type: "atm" },
];

export default function PlaceFilterButtons({ onSelectCategory }) {
    const [selectedCategory, setSelectedCategory] = useState(null);

    const handlePress = (category) => {
        const newCategory = selectedCategory === category ? null : category;
        setSelectedCategory(newCategory);
        onSelectCategory(newCategory);
    };

    return (
        <View style={styles.container}>
            {categories.map((category) => (
                <TouchableOpacity
                    key={category.type}
                    style={[
                        styles.button,
                        selectedCategory === category.type && styles.selectedButton,
                    ]}
                    onPress={() => handlePress(category.type)}
                >
                    <Text
                        style={[
                            styles.text,
                            selectedCategory === category.type && styles.selectedText,
                        ]}
                    >
                        {category.name}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "center",
        marginVertical: 10,
    },
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginHorizontal: 5,
        borderRadius: 20,
    },
    selectedButton: {
        backgroundColor: theme.colors.secondary,
    },
    text: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: "bold",
    },
    selectedText: {
        color: theme.colors.dark,
    },
});
