import React, {useEffect, useRef, useState} from 'react';
import {
    Animated,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    Platform
} from 'react-native';
import Svg, {Image as SvgImage, Path, Rect} from 'react-native-svg';
import {GestureHandlerRootView, PinchGestureHandler} from 'react-native-gesture-handler';
import {floorsData} from '@/constants/floorData';
import {useNavigation, useRoute} from '@react-navigation/native';
import {theme} from '@/constants/theme';
import {Ionicons} from '@expo/vector-icons';
import FloorSelector from '../components/FloorSelector';
import SectionPanel from '../components/SectionPanel';


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


    const getPathFromNodes = (nodeIds) => {
        const coordinates = nodeIds.map(nodeId => {
            let node = null;
            let yDif = 0;
            if (buildingKey == 'Hall') {
                if (selectedFloorKey == 1) {
                    node = mapHall1.nodes.find(n => n.id === nodeId);
                } else if (selectedFloorKey == 2) {
                    node = mapHall2.nodes.find(n => n.id === nodeId);
                } else if (selectedFloorKey == 8) {
                    node = mapHall8.nodes.find(n => n.id === nodeId);
                } else if (selectedFloorKey == 9) {
                    node = mapHall9.nodes.find(n => n.id === nodeId);
                }
                yDif = 1132;
            } else if (buildingKey == "MB") {
                if (selectedFloorKey == "S2") {
                    node = mapMB1.nodes.find(n => n.id === nodeId);
                } else if (selectedFloorKey == "S1") {
                    node = mapMBS2.nodes.find(n => n.id === nodeId);
                }
                yDif = 1132;

            } else if (buildingKey == "CC") {
                if (selectedFloorKey == "1") {
                    node = mapCC1.nodes.find(n => n.id === nodeId);
                }
                yDif = 746;

            }


            return node ? `${node.x},${yDif - node.y}` : null;
        }).filter(coord => coord !== null);

        return `M${coordinates.join(' L')}`;
    };

    const [path, setPath] = useState(null);
    const [selectedPath, setSelectedPath] = useState(null);

    const [showSearchBar, setShowSearchBar] = useState(false);

    const [startLocationIndoor, setStartLocationIndoor] = useState("");

    useEffect(() => {
        if (path) {
            const nodeIds = path;
            const newPath = getPathFromNodes(nodeIds);
            setSelectedPath(newPath);


            const floorChanges = [];
            let lastFloor = null;

            nodeIds.forEach((nodeId) => {
                const node = getNodeData(nodeId);

                if (node) {
                    const currentFloor = node.floor_number;
                    if (lastFloor !== null && currentFloor !== lastFloor) {
                        floorChanges.push({
                            transitionNode: node,
                            previousFloor: lastFloor,
                            newFloor: currentFloor
                        });
                    }
                    lastFloor = currentFloor;
                }
            });

            if (floorChanges.length > 0) {
                let message = "There are floor changes in you path, you need to go:\n";
                floorChanges.forEach(change => {
                    message += `  - From floor ${change.previousFloor} to floor ${change.newFloor} using ${change.transitionNode.poi_type}\n`;
                });
                setMultiFloorMessage(message);
            } else {
                setMultiFloorMessage("");
            }
        }


    }, [path, selectedFloorKey]);

    useEffect(() => {
        const loadAccessibilityOption = async () => {
            const accessibility = await AsyncStorage.getItem("@accessibility");
            if (accessibility) setAccessibilityOption(JSON.parse(accessibility));
        };
        loadAccessibilityOption();
    }, []);


    const getNodeData = (nodeId) => {
        let node = null;
        if (buildingKey === 'Hall') {
            node = [...mapHall1.nodes, ...mapHall2.nodes, ...mapHall8.nodes, ...mapHall9.nodes].find(n => n.id === nodeId);
        } else if (buildingKey === "MB") {
            node = [...mapMB1.nodes, ...mapMBS2.nodes].find(n => n.id === nodeId);
        } else if (buildingKey === "CC") {
            node = mapCC1.nodes.find(n => n.id === nodeId);
        }
        return node;
    };

    const getNodeDataRefID = (nodeId) => {
        const buildingFloors = floorsData[buildingKey];
        let foundSection = null;

        Object.values(buildingFloors).forEach(floor => {
            const section = floor.sections.find(s => s.id === nodeId);
            if (section) {
                foundSection = section;
            }
        });


        if (foundSection) {
            if (foundSection !== "") {
                if (foundSection.ref_ID !== "") {
                    return foundSection.ref_ID;
                }
            }
        }
        return null;
    };


    const getFromFloorData = (nodeId) => {
        const buildingFloors = floorsData[buildingKey];
        if (!buildingFloors) {
            return false;
        }

        return Object.values(buildingFloors).some(floor => {
            return floor.sections.some(section => section.id === nodeId);
        });
    };

    const checkNodeInFloorData = (nodeId) => {
        return getFromFloorData(nodeId);
    };


    const handleShowDirectionsSection = async (endId) => {
        if (checkNodeInFloorData(startLocationIndoor) && checkNodeInFloorData(endId.id)) {
            const transformedStartLocationIndoor = getNodeDataRefID(startLocationIndoor)
            const transformedEndId = endId.ref_ID;

            if (transformedStartLocationIndoor && transformedEndId) {
                try {
                    const host=Platform.OS ==="android"? "10.0.2.2":"127.0.0.1";
                    const response = await fetch(
                        `http://${host}:5000/indoorNavigation?startId=${transformedStartLocationIndoor}&endId=${transformedEndId}&campus=${buildingKey}&accessibility=${accessibilityOption}`
                    );

                    if (response.ok) {
                        const data = await response.json();
                        setPath(data.path.path);

                    } else {
                        console.error("Error fetching data");
                    }
                } catch (error) {
                    console.error("Request failed", error);
                }
            }
        }
    };

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
            {/*<TouchableWithoutFeedback onPress={() => setSelectedSection(null)}>*/}
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
                                        <Rect width="100%" height="100%" fill={theme.colors.grayDark}/>

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

InnerMapScreen.propTypes={
    buildingKey:PropTypes.any
}
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
        top: 57,
        left: 0,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: theme.radius.lg,
        elevation: 5,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
});
