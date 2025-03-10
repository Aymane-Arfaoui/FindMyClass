import React, {useEffect, useRef, useState} from 'react';
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


import mapHall2 from '../api/app/data/campus_jsons/hall/map_hall_2.json';


const MapScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();

    const {buildingKey} = route.params || {};

    if (!buildingKey || !floorsData[buildingKey]) {
        return (
            <View style={styles.container}>
                <Text style={styles.noDataText}>No indoor map data available for this building.</Text>
            </View>
        );
    }

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
            const node = mapHall2.nodes.find(n => n.id === nodeId);
            return node ? `${node.x},${1132 - node.y}` : null;
        }).filter(coord => coord !== null);

        return `M${coordinates.join(' L')}`;
    };

    // const selectedPath = path ? getPathFromNodes(path) : null; // Use the path from the API
    const [path, setPath] = useState(null); // to store the path data
    const [selectedPath, setSelectedPath] = useState(null); // to store the computed path


    useEffect(() => {
        if (path) {
            const nodeIds = path; // pass the path from API as node IDs
            const newPath = getPathFromNodes(nodeIds); // get the new path
            setSelectedPath(newPath); // update the selectedPath
        }
    }, [path]);


    const handleShowDirections = async (endId) => {
        const startId = "h2_209"; // fixed starting point
        const campus = "hall"; // specify the campus folder

        try {
            const response = await fetch(
                // `http://10.0.2.2:5000/indoorNavigation?startId=${startId}&endId=${endId}&campus=${campus}`
                `http://10.0.2.2:5000/indoorNavigation?startId=h2_231&endId=h2_260&campus=hall`
            );

            if (response.ok) {
                const data = await response.json();
                console.log("Path data received:", data);
                console.log("Path data received3:", data.path.path);
                setPath(data.path.path); // Assuming the API returns a path
            } else {
                console.error("Error fetching data");
            }
        } catch (error) {
            console.error("Request failed", error);
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

                                        {/*{poiImage && (*/}

                                        {/*//     <Path*/}
                                        {/*//     d={`M87.75,588.6 L87.92,560.77 L565.71,577.53 L690.67,627.53 L690.67,888.21`}*/}
                                        {/*//     fill="none"*/}
                                        {/*//     stroke={theme.colors.primaryLight}*/}
                                        {/*//     strokeWidth="6"*/}
                                        {/*// />)}*/}

                                        {/*    <Path*/}
                                        {/*    d={selectedPath}*/}
                                        {/*    fill="none"*/}
                                        {/*    stroke={theme.colors.primaryLight}*/}
                                        {/*    strokeWidth="6"*/}
                                        {/*/>)}*/}



                                    </Svg>
                                </Animated.View>
                            </PinchGestureHandler>
                        </View>
                    </ScrollView>

                    {/* Floor Selector */}
                    <FloorSelector
                        floorKeys={floorKeys}
                        selectedFloorKey={selectedFloorKey}
                        setSelectedFloorKey={(floor) => {
                            setSelectedFloorKey(floor);
                            resetTransform();
                        }}
                    />
                    <SectionPanel
                        selectedSection={selectedSection}
                        onClose={() => setSelectedSection(null)}
                        panHandlers={panResponder.panHandlers}
                        panelY={panelY}
                        onShowDirections={() => handleShowDirections(selectedSection?.id)}

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
        backgroundColor: theme.colors.backgroundDark,
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
        top: 50,
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
