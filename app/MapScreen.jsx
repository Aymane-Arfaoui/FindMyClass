import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    PanResponder,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import Svg, { Image as SvgImage, Path, Rect } from 'react-native-svg';
import { GestureHandlerRootView, PinchGestureHandler } from 'react-native-gesture-handler';
import { floorsData } from '@/constants/floorData';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import FloorSelector from '../components/FloorSelector';
import SectionPanel from '../components/SectionPanel';
import IndoorSearchBars from '@/components/IndoorSearchBars';
import IndoorSearchBar from '@/components/IndoorSearchBar';
import PropTypes from 'prop-types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '@/context/ThemeProvider';
import {
    getIndoorPath,
    getMultiFloorMessage,
    getNodeData,
    getNodeDataFullNode,
    getNodeDataRefID,
    getPathFromNodes,
    getBuildingFromSectionId,
    getEntranceFromBuilding,
} from '../services/indoorNodesHelper';

// Import map data for all buildings
import mapHall1 from '../api/app/data/campus_jsons/hall/map_hall_1.json';
import mapHall2 from '../api/app/data/campus_jsons/hall/map_hall_2.json';
import mapHall8 from '../api/app/data/campus_jsons/hall/map_hall_8.json';
import mapHall9 from '../api/app/data/campus_jsons/hall/map_hall_9.json';
import mapMB1 from '../api/app/data/campus_jsons/mb/map_mb_1.json';
import mapMBS2 from '../api/app/data/campus_jsons/mb/map_mb_s2.json';
import mapCC1 from '../api/app/data/campus_jsons/cc/map_cc_1.json';
import mapVL1 from '../api/app/data/campus_jsons/vl/map_vl_1.json';
import mapVL2 from '../api/app/data/campus_jsons/vl/map_vl_2.json';
import mapVE2 from '../api/app/data/campus_jsons/vl/map_ve.json';

// Outer component to handle route params and theme
const MapScreen = () => {
    const route = useRoute();
    const { theme } = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { buildingKey, classroomNum } = route.params || {};

    if (!buildingKey || !floorsData[buildingKey]) {
        return (
            <View style={styles.container}>
                <Text style={styles.noDataText}>No indoor map data available for this building.</Text>
            </View>
        );
    }

    return <InnerMapScreen buildingKey={buildingKey} classroomNum={classroomNum} styles={styles} theme={theme} />;
};

// Inner component with core map logic
const InnerMapScreen = ({ buildingKey, classroomNum, styles, theme }) => {
    const navigation = useNavigation();

    // State variables
    const [selectedFloorKey, setSelectedFloorKey] = useState(Object.keys(floorsData[buildingKey])[0]);
    const [selectedSection, setSelectedSection] = useState(null);
    const [showSearchBar, setShowSearchBar] = useState(!!classroomNum);
    const [startLocationIndoor, setStartLocationIndoor] = useState('');
    const [destinationIndoor, setDestinationIndoor] = useState(classroomNum || '');
    const [path, setPath] = useState(null);
    const [selectedPath, setSelectedPath] = useState(null);
    const [multiFloorMessage, setMultiFloorMessage] = useState('');
    const [accessibilityOption, setAccessibilityOption] = useState(false);
    const [isSwitchToOutdoor, setIsSwitchToOutdoor] = useState(false);
    const [switchedBuilding, setSwitchedBuilding] = useState(false);

    // Floor and SVG data
    const buildingFloors = floorsData[buildingKey];
    const selectedFloorData = buildingFloors[selectedFloorKey];
    const { viewBox, sections = [], poiImage, width, height } = selectedFloorData;
    const aspectRatio = width / height;

    // Animation refs
    const panelY = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    // PanResponder for panel dragging
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) panelY.setValue(gestureState.dy);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 50) setSelectedSection(null);
                Animated.spring(panelY, { toValue: 0, useNativeDriver: true }).start();
            },
        })
    ).current;

    // Pinch gesture handler
    const onPinchEvent = Animated.event([{ nativeEvent: { scale } }], { useNativeDriver: false });

    // Reset map transformations
    const resetTransform = () => {
        Animated.timing(scale, { toValue: 1, duration: 300, useNativeDriver: false }).start();
        Animated.timing(translateX, { toValue: 0, duration: 300, useNativeDriver: false }).start();
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: false }).start();
    };

    // Load accessibility and initial classroom data
    useEffect(() => {
        const loadAccessibility = async () => {
            const accessibility = await AsyncStorage.getItem('@accessibility');
            if (accessibility) setAccessibilityOption(JSON.parse(accessibility));
        };
        loadAccessibility();

        if (classroomNum) {
            const initialSection = getNodeDataFullNode(classroomNum, buildingKey);
            if (initialSection) {
                setSelectedSection(initialSection);
                setDestinationIndoor(classroomNum);
                handleShowDirectionsSection(initialSection, '');
            } else {
                console.warn(`No section found for classroomNum: ${classroomNum}`);
            }
        }
    }, [classroomNum, buildingKey]);

    // Update path when path or floor changes
    useEffect(() => {
        if (path) {
            const newPath = getPathFromNodes(path, buildingKey, selectedFloorKey);
            setSelectedPath(newPath);
            const message = getMultiFloorMessage(path, buildingKey);
            setMultiFloorMessage(message);
        } else {
            setSelectedPath(null);
            setMultiFloorMessage('');
        }
    }, [path, selectedFloorKey, buildingKey]);

    // Trigger directions when start or destination changes
    useEffect(() => {
        if (startLocationIndoor && selectedSection?.id && showSearchBar) {
            handleShowDirectionsSection(selectedSection, startLocationIndoor);
        }
    }, [startLocationIndoor, selectedSection, showSearchBar, buildingKey]);

    // Handle section press
    const handlePress = (section) => {
        if (!['floor', 'background', 'line', 'N/A'].includes(section.id)) {
            setSelectedSection(section);
            setDestinationIndoor(section.id);
        }
    };

    // Show directions between start and end points
    const handleShowDirectionsSection = async (endId, startIdIndoor = '') => {
        const endBuilding = getBuildingFromSectionId(endId.id);
        const effectiveStartLocation = startIdIndoor || getEntranceFromBuilding(endBuilding);
        const startBuilding = getBuildingFromSectionId(effectiveStartLocation);

        if (startBuilding !== endBuilding) {
            setShowSearchBar(false);
            setMultiFloorMessage('');
            setSelectedPath(null);
            setPath(null);
            setSwitchedBuilding(true);
            setIsSwitchToOutdoor(true);
            navigation.navigate('MapScreen', { buildingKey: startBuilding });
            return;
        }

        const indoorPath = await getIndoorPath(effectiveStartLocation, endId, buildingKey, accessibilityOption);
        if (indoorPath) {
            setPath(indoorPath);
            setShowSearchBar(true);
        } else {
            console.warn('No valid path found.');
        }
    };

    // Close search bars and reset state
    const closeIndoorSearchBars = () => {
        setShowSearchBar(false);
        setMultiFloorMessage('');
        setSelectedPath(null);
        setStartLocationIndoor('');
        setPath(null);
    };

    // Handle building switch logic
    useEffect(() => {
        if (switchedBuilding) {
            const tempDestinationRoom =
                {
                    Hall: 'Hall Building Exit',
                    MB: 'MB Building Exit',
                    CC: 'CC Building Exit',
                    VL: 'Vanier Library Exit',
                }[buildingKey] || '';
            const tempSection = getNodeDataFullNode(tempDestinationRoom, buildingKey);

            setShowSearchBar(true);
            setMultiFloorMessage('');
            setSelectedPath(null);
            setPath(null);
            setDestinationIndoor(tempDestinationRoom);
            setSelectedSection(tempSection);
            setIsSwitchToOutdoor(true);
            setSwitchedBuilding(false); // Reset after handling
        }
    }, [switchedBuilding, buildingKey]);

    return (
        <GestureHandlerRootView style={styles.container}>
            <TouchableWithoutFeedback>
                <View style={styles.container}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={28} color={theme.colors.dark} />
                    </TouchableOpacity>

                    {showSearchBar && (
                        <IndoorSearchBars
                            startLocation={classroomNum ? 'Entrance' : startLocationIndoor}
                            setStartLocation={setStartLocationIndoor}
                            onShowDirectionsUpdate={() => handleShowDirectionsSection(selectedSection)}
                            onShowDirectionsUpdateTemp={() => setShowSearchBar(true)}
                            destination={destinationIndoor}
                            onBackPress={closeIndoorSearchBars}
                            navigation={navigation}
                            resetTransform={resetTransform}
                        />
                    )}

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={[styles.mapContainer, { aspectRatio }]}>
                            <PinchGestureHandler onGestureEvent={onPinchEvent}>
                                <Animated.View style={{ transform: [{ scale }, { translateX }, { translateY }] }}>
                                    <Svg width="100%" height="100%" viewBox={viewBox}>
                                        <Rect width="100%" height="100%" fill={theme.colors.floorFill} />
                                        {sections.map((section, index) => (
                                            <Path
                                                key={index}
                                                d={section.d}
                                                fill={
                                                    selectedSection?.id === section.id
                                                        ? theme.colors.primaryLight
                                                        : section.id === 'floor'
                                                            ? theme.colors.roomFill
                                                            : theme.colors.floorFill
                                                }
                                                stroke={theme.colors.line}
                                                strokeWidth="2"
                                                onPress={() => handlePress(section)}
                                            />
                                        ))}
                                        {poiImage && (
                                            <SvgImage
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
                                            <Path d={selectedPath} fill="none" stroke={theme.colors.primaryLight} strokeWidth="6" />
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
                        floorKeys={Object.keys(buildingFloors)}
                        selectedFloorKey={selectedFloorKey}
                        setSelectedFloorKey={(floor) => {
                            if (path && !path.map((id) => getNodeData(id, buildingKey)?.floor_number).includes(floor)) {
                                setPath(null);
                                setSelectedPath(null);
                                setShowSearchBar(false);
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
                        onShowDirectionsTemp={() => setShowSearchBar(true)}
                        showButtonDirections={!showSearchBar}
                        multiFloorText={multiFloorMessage}
                        boolSwitchToOutdoor={isSwitchToOutdoor}
                    />
                </View>
            </TouchableWithoutFeedback>
        </GestureHandlerRootView>
    );
};

// PropTypes validation
InnerMapScreen.propTypes = {
    buildingKey: PropTypes.string.isRequired,
    classroomNum: PropTypes.string,
    styles: PropTypes.object.isRequired,
    theme: PropTypes.object.isRequired,
};

MapScreen.propTypes = {
    buildingKey: PropTypes.string,
};

// Styles factory function
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
            top: 50,
            left: 0,
            paddingVertical: 8,
            paddingHorizontal: 15,
            borderRadius: theme.radius.lg,
            zIndex: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
        },
    });

export default MapScreen;