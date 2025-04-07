import React, {useContext, useEffect, useMemo, useRef, useState} from 'react';
import {
    Animated,
    PanResponder,
    Platform,
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
import {Ionicons} from '@expo/vector-icons';
import FloorSelector from '../components/FloorSelector';
import SectionPanel from '../components/SectionPanel';
import AppNavigationPanel from '@/components/AppNavigationPannel';
import {hp, wp} from '@/helpers/common';


import mapHall1 from '../api/app/data/campus_jsons/hall/map_hall_1.json';
import mapHall2 from '../api/app/data/campus_jsons/hall/map_hall_2.json';
import mapHall8 from '../api/app/data/campus_jsons/hall/map_hall_8.json';
import mapHall9 from '../api/app/data/campus_jsons/hall/map_hall_9.json';

import mapMB1 from '../api/app/data/campus_jsons/mb/map_mb_1.json';
import mapMBS2 from '../api/app/data/campus_jsons/mb/map_mb_s2.json';

import mapCC1 from '../api/app/data/campus_jsons/cc/map_cc_1.json';


import IndoorSearchBars from "@/components/IndoorSearchBars";
import IndoorSearchBar from "@/components/IndoorSearchBar";
import PropTypes from "prop-types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {ThemeContext} from "@/context/ThemeProvider";
import {
    getIndoorPath,
    getMultiFloorMessage,
    getNodeData,
    getNodeDataRefID,
    getPathFromNodes
} from "../services/indoorNodesHelper";


const MapScreen = () => {
    const route = useRoute();
    const {theme} = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);
    const {buildingKey} = route.params || {};

    if (!buildingKey || !floorsData[buildingKey]) {
        return (
            <View style={styles.container}>
                <Text style={styles.noDataText}>No indoor map data available for this building.</Text>
            </View>
        );
    }
    return (<InnerMapScreen buildingKey={buildingKey} styles={styles} theme={theme}/>);
};
const InnerMapScreen = ({buildingKey,styles, theme}) => { //avoids creating react hooks conditionally
    const navigation = useNavigation();

    const buildingFloors = floorsData[buildingKey];
    const floorKeys = Object.keys(buildingFloors);
    const [selectedFloorKey, setSelectedFloorKey] = useState(floorKeys[0]);
    const [selectedSection, setSelectedSection] = useState(null);
    const selectedFloorData = buildingFloors[selectedFloorKey];
    const {viewBox, sections = [], poiImage, width, height} = selectedFloorData;
    const aspectRatio = width / height;
    const panelY = useRef(new Animated.Value(0)).current;

    const [accessibilityOption, setAccessibilityOption] = useState(false);
    const [multiFloorMessage, setMultiFloorMessage] = useState(null);

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
        // resetTransform(section);
    };
    const scale = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const onPinchEvent = Animated.event([{nativeEvent: {scale}}], {
        useNativeDriver: false,
    });
    const resetTransform = () => {
        Animated.timing(scale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
        }).start();
        Animated.timing(translateX, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
        Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    };




    const [path, setPath] = useState(null);
    const [selectedPath, setSelectedPath] = useState(null);

    const [showSearchBar, setShowSearchBar] = useState(false);

    const [startLocationIndoor, setStartLocationIndoor] = useState("");

    useEffect(() => {
        if (path) {
            const newPath = getPathFromNodes(path,buildingKey,selectedFloorKey);
            setSelectedPath(newPath);
            const message=getMultiFloorMessage(path,buildingKey);
            setMultiFloorMessage(message);
        }


    }, [path, selectedFloorKey]);

    useEffect(() => {
        const loadAccessibilityOption = async () => {
            const accessibility = await AsyncStorage.getItem("@accessibility");
            if (accessibility) setAccessibilityOption(JSON.parse(accessibility));
        };
        loadAccessibilityOption();
    }, []);
    const handleShowDirectionsSection = async (endId) => {
        const indoorPath = await getIndoorPath(startLocationIndoor, endId, buildingKey, accessibilityOption);
        if(indoorPath)
        {
            setPath(indoorPath)
        }
    }


    const handleShowDirectionsTemp = () => {
        setShowSearchBar(true);
    };

    useEffect(() => {
        if (startLocationIndoor && selectedSection?.id) {
            handleShowDirectionsSection(selectedSection);
            handleShowDirectionsTemp();
        }
    }, [startLocationIndoor, selectedSection?.id]);


    const closeIndoorSearchBars = () => {
        setShowSearchBar(false);
        setMultiFloorMessage("")
        setSelectedPath(null)
        setStartLocationIndoor("")
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <TouchableWithoutFeedback>
                <View style={styles.container}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={28} color={theme.colors.dark}/>
                    </TouchableOpacity>

                    {showSearchBar && (

                        <IndoorSearchBars
                            startLocation={startLocationIndoor}
                            setStartLocation={setStartLocationIndoor}


                            onShowDirectionsUpdate={() => handleShowDirectionsSection(selectedSection)}
                            onShowDirectionsUpdateTemp={handleShowDirectionsTemp}

                            destination={selectedSection?.id}
                            onBackPress={() => closeIndoorSearchBars()}

                            navigation={navigation}
                            resetTransform={resetTransform}

                        />

                    )}

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
                                        <Rect width="100%" height="100%" fill={theme.colors.floorFill}/>

                                        {sections.map((section, index) => (
                                            <Path
                                                testID={`section-${index}`}
                                                key={index}
                                                d={section.d}
                                                fill={
                                                    selectedSection?.id === section.id
                                                        ? theme.colors.primaryLight
                                                        : section.id === "floor"
                                                            ? theme.colors.roomFill
                                                            : theme.colors.floorFill

                                                }
                                                stroke={theme.colors.line}
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
                                        {selectedPath && (

                                            <Path
                                                d={selectedPath}
                                                fill="none"
                                                stroke={theme.colors.primaryLight}
                                                strokeWidth="6"
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
                            if (path) {
                                const validFloors = path.map(nodeId => getNodeData(nodeId)?.floor_number);
                                if (!validFloors.includes(floor)) {
                                    setPath(null);
                                    setSelectedPath(null);
                                    setShowSearchBar(false);
                                }
                            }
                            setSelectedFloorKey(floor);
                            resetTransform();
                        }}
                        onChangeUpdateRoute={() => handleShowDirectionsSection(selectedSection)}
                    />
                    <SectionPanel
                        selectedSection={selectedSection}
                        onClose={() => setSelectedSection(null)}
                        panHandlers={panResponder.panHandlers}
                        panelY={panelY}
                        onShowDirections={() => handleShowDirectionsSection(selectedSection)}
                        onShowDirectionsTemp={handleShowDirectionsTemp}
                        showButtonDirections={!showSearchBar}
                        multiFloorText={multiFloorMessage}
                    />
                </View>
            </TouchableWithoutFeedback>
        </GestureHandlerRootView>
    );
};

InnerMapScreen.propTypes = {
    buildingKey: PropTypes.any, styles:PropTypes.any, theme:PropTypes.any
}
export default MapScreen;

const createStyles = (theme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.cardBackground,
        },
        noDataText: {
            fontSize: 18,
            textAlign: 'center',
            marginTop: 50,
            color: theme.colors.text,
        },
        mapContainer: {
            height: '100%',
            position: 'relative',
        },
        backButton: {
            position: 'absolute',
            top: hp(5.5),
            left: 0,
            paddingVertical: 8,
            paddingHorizontal: 15,
            borderRadius: theme.radius.lg,
            zIndex: 10,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.2,
            shadowRadius: 3,
        },
    });
