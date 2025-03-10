import React, {useRef, useState} from 'react';
import {
    Animated,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import Svg, {Image as SvgImage, Path, Rect} from 'react-native-svg';
import {GestureHandlerRootView, PinchGestureHandler} from 'react-native-gesture-handler';
import {floorsData} from '@/constants/floorData';
import {useNavigation, useRoute} from '@react-navigation/native';
import {theme} from '@/constants/theme';
import {Ionicons} from '@expo/vector-icons';
import FloorSelector from '../components/FloorSelector';
import SectionPanel from '../components/SectionPanel';
import IndoorSearchBar from "@/components/IndoorSearchBar";

const MapScreen = () => {
    const route = useRoute();
    const {buildingKey} = route.params || {};

    if (!buildingKey || !floorsData[buildingKey]) {
        return (
            <View style={styles.container}>
                <Text style={styles.noDataText}>No indoor map data available for this building.</Text>
            </View>
        );
    }
    return (<InnerMapScreen buildingKey={buildingKey}/>);
};
const InnerMapScreen = ({buildingKey}) => { //avoids creating react hooks conditionally
    const navigation = useNavigation();

    const buildingFloors = floorsData[buildingKey];
    const floorKeys = Object.keys(buildingFloors);
    const [selectedFloorKey, setSelectedFloorKey] = useState(floorKeys[0]);
    const [selectedSection, setSelectedSection] = useState(null);
    const selectedFloorData = buildingFloors[selectedFloorKey];
    const {viewBox, sections = [], poiImage, width, height} = selectedFloorData;
    const aspectRatio = width / height;
    const panelY = useRef(new Animated.Value(0)).current;
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (event, gestureState) => {
                if (gestureState.dy > 0) {
                    panelY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (event, gestureState) => {
                if (gestureState.dy > 50) {
                    setSelectedSection(null);
                }
                Animated.spring(panelY, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            },
        })
    ).current;

    const handlePress = (section) => {
        setSelectedSection(section);
        resetTransform(section);
    };
    const scale = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const onPinchEvent = Animated.event([{nativeEvent: {scale}}], {
        useNativeDriver: false,
    });
    const resetTransform = (section = null) => {
        if (section && section.x !== undefined && section.y !== undefined) {
            Animated.parallel([
                Animated.timing(translateX, {
                    toValue: -section.x + width / 2,
                    duration: 500,
                    useNativeDriver: false,
                }),
                Animated.timing(translateY, {
                    toValue: -section.y + height / 2,
                    duration: 500,
                    useNativeDriver: false,
                }),
                Animated.timing(scale, {
                    toValue: 0.5,
                    duration: 500,
                    useNativeDriver: false,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(translateX, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                }),
            ]).start();
        }
    };


    return (
        <GestureHandlerRootView style={styles.container}>
            <TouchableWithoutFeedback onPress={() => setSelectedSection(null)}>
                <View style={styles.container}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={28} color={theme.colors.dark}/>
                    </TouchableOpacity>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={[styles.mapContainer, {aspectRatio}]}>
                            <PinchGestureHandler onGestureEvent={onPinchEvent}>
                                <Animated.View
                                    style={{
                                        transform: [
                                            {scale},
                                            {translateX},
                                            {translateY}
                                        ]
                                    }}
                                >
                                    <Svg width="100%" height="100%" viewBox={viewBox}>
                                        <Rect width="100%" height="100%" fill={theme.colors.backgroundDark}/>
                                        {sections.map((section, index) => (
                                            <Path
                                                testID={`section-${index}`}
                                                key={index}
                                                d={section.d}
                                                fill={
                                                    selectedSection?.id === section.id
                                                        ? theme.colors.primaryLight
                                                        : section.id === "floor"
                                                            ? theme.colors.gray
                                                            : section.id === "background"
                                                                ? theme.colors.grayDark
                                                                : "white"
                                                }
                                                stroke={theme.colors.dark}
                                                strokeWidth="2"
                                                onPress={
                                                    section.id === "floor" ||
                                                    section.id === "background" ||
                                                    section.id === "line" ||
                                                    section.id === "N/A"
                                                        ? null
                                                        : () => handlePress(section)
                                                }
                                            />
                                        ))}
                                        {poiImage && (
                                            <SvgImage
                                                testID={'svg-image'}
                                                href={poiImage}
                                                x="0"
                                                y="0"
                                                width="100%"
                                                height="100%"
                                                preserveAspectRatio="xMidYMid meet"
                                                opacity="1"
                                                pointerEvents="none"
                                            />
                                        )}
                                    </Svg>
                                </Animated.View>
                            </PinchGestureHandler>
                        </View>
                    </ScrollView>

                    <IndoorSearchBar
                        navigation={navigation}
                        setSelectedFloorKey={setSelectedFloorKey}
                        setSelectedSection={setSelectedSection}
                        resetTransform={resetTransform}
                    />

                    <FloorSelector
                        floorKeys={floorKeys}
                        selectedFloorKey={selectedFloorKey}
                        setSelectedFloorKey={(floor) => {
                            setSelectedFloorKey(floor);
                            setSelectedSection(null);
                            resetTransform();
                        }}
                    />
                    <SectionPanel
                        selectedSection={selectedSection}
                        onClose={() => setSelectedSection(null)}
                        panHandlers={panResponder.panHandlers}
                        panelY={panelY}
                    />
                </View>
            </TouchableWithoutFeedback>
        </GestureHandlerRootView>
    );
};

export default MapScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.grayDark,
    },
    noDataText: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 50,
        color: theme.colors.textLight,
    },
    mapContainer: {
        height: '100%',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 0,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: theme.radius.lg,
        elevation: 5,
        zIndex: 10,
        shadowColor: theme.colors.text,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
});
