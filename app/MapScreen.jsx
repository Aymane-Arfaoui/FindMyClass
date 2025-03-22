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


import mapHall1 from '../api/app/data/campus_jsons/hall/map_hall_2.json';
import mapHall2 from '../api/app/data/campus_jsons/hall/map_hall_2.json';
import mapHall8 from '../api/app/data/campus_jsons/hall/map_hall_8.json';
import mapHall9 from '../api/app/data/campus_jsons/hall/map_hall_9.json';

import mapMB1 from '../api/app/data/campus_jsons/mb/map_mb_1.json';
import mapMBS2 from '../api/app/data/campus_jsons/mb/map_mb_s2.json';

import mapCC1 from '../api/app/data/campus_jsons/cc/map_cc_1.json';


import IndoorSearchBars from "@/components/IndoorSearchBars";
import IndoorSearchBar from "@/components/IndoorSearchBar";


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
//     return (<InnerMapScreen buildingKey={buildingKey}/>);
// };
// const InnerMapScreen = ({buildingKey}) => {
//     const navigation = useNavigation();

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
            if (buildingKey == 'Hall'){
                if (selectedFloorKey == 1) {
                    node = mapHall1.nodes.find(n => n.id === nodeId);
                }
                else if (selectedFloorKey == 2){
                    node = mapHall2.nodes.find(n => n.id === nodeId);
                }
                else if (selectedFloorKey == 8){
                    node = mapHall8.nodes.find(n => n.id === nodeId);
                }
                else if (selectedFloorKey == 9){
                    node = mapHall9.nodes.find(n => n.id === nodeId);
                }
            }

            else if (buildingKey == "MB"){
                if (selectedFloorKey == "S2") {
                    node = mapMB1.nodes.find(n => n.id === nodeId);
                }
                else if (selectedFloorKey == "S1"){
                    node = mapMBS2.nodes.find(n => n.id === nodeId);
                }

            }

            else if (buildingKey == "CC"){
                if (selectedFloorKey == "1") {
                    node = mapCC1.nodes.find(n => n.id === nodeId);
                }
            }


            return node ? `${node.x},${1132 - node.y}` : null;
        }).filter(coord => coord !== null);

        return `M${coordinates.join(' L')}`;
    };

    // const selectedPath = path ? getPathFromNodes(path) : null;
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

            nodeIds.forEach((nodeId, index) => {
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

            // if (floorChanges.length > 0) {
            //     floorChanges.forEach(change => {
            //         alert(`Change floors from ${change.previousFloor} to ${change.newFloor} using ${change.transitionNode.poi_type}`);
            //     });
            // }
            if (floorChanges.length > 0) {
                let message = "There are floor changes in you path, you need to go:\n";
                floorChanges.forEach(change => {
                    message += `- From floor ${change.previousFloor} to floor ${change.newFloor} using ${change.transitionNode.poi_type}\n`;
                });
                alert(message);
            }
        }


    }, [path, selectedFloorKey]);




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




    const transformId = (id) => {
        const [letter, number] = id.split("-");
        const floorNumber = number.charAt(0);
        return `${letter.toLowerCase()}${floorNumber}_${number}`;
    };


    const handleShowDirections = async (endId) => {
        const transformedStartLocationIndoor = transformId(startLocationIndoor)
        const transformedEndId = transformId(endId);

        // const startId = "h8_815"; // Only use for testing, remove later.
        const campus = "hall"; // Only use for testing, remove later.

        console.log({startLocationIndoor}) // Used only for testing, remove later.
        console.log({endId}) // Used only for testing, remove later.
        console.log({ endId, transformedEndId }); // Used only for testing, remove later.

        // const transformedEndId = endId.replace(/([A-Za-z])-([0-9])/, "$1$2_");

        try {
            const response = await fetch(
                `http://10.0.2.2:5000/indoorNavigation?startId=${transformedStartLocationIndoor}&endId=${transformedEndId}&campus=${campus}`
                // `http://10.0.2.2:5000/indoorNavigation?startId=h2_205&endId=h2_260&campus=hall` // Only use for testing, remove later.
            );

            if (response.ok) {
                const data = await response.json();
                console.log("Start location: ", transformedStartLocationIndoor, ", end location: ", transformedEndId);
                console.log("Path data received:", data);
                console.log("Path data received TEST:", data.path.path);
                setPath(data.path.path);
            } else {
                console.error("Error fetching data");
            }
        } catch (error) {
            console.error("Request failed", error);
        }
    };

    const handleShowDirectionsTemp = () => {
        setShowSearchBar(true);
    };

    useEffect(() => {
        if (startLocationIndoor && selectedSection?.id) {
            handleShowDirections(selectedSection.id);
            handleShowDirectionsTemp();
        }
    }, [startLocationIndoor, selectedSection?.id]);


    const closeIndoorSearchBars = (bool) => {
        setShowSearchBar(false);
    };




    return (
        <GestureHandlerRootView style={styles.container}>
            <TouchableWithoutFeedback onPress={() => setSelectedSection(null)}>
                <View style={styles.container}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={28} color={theme.colors.dark}/>
                    </TouchableOpacity>

                    {showSearchBar && (

                        <IndoorSearchBars
                            startLocation={startLocationIndoor}
                            setStartLocation={setStartLocationIndoor}


                            onShowDirectionsUpdate={() => handleShowDirections(selectedSection?.id)}
                            onShowDirectionsUpdateTemp={handleShowDirectionsTemp}

                            // startLocation={selectedSection?.id}
                            destination={selectedSection?.id}
                            onBackPress={() => closeIndoorSearchBars(false)}

                            navigation={navigation}
                            // setSelectedFloorKey={setSelectedFloorKey}
                            // setSelectedSection={setSelectedSection}
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
                        onChangeUpdateRoute={() => handleShowDirections(selectedSection?.id)} //ADD HERE
                        // onChangeUpdateRouteTemp={handleShowDirectionsTemp} //ADD HERE
                    />
                    <SectionPanel
                        selectedSection={selectedSection}
                        onClose={() => setSelectedSection(null)}
                        panHandlers={panResponder.panHandlers}
                        panelY={panelY}
                        onShowDirections={() => handleShowDirections(selectedSection?.id)}
                        onShowDirectionsTemp={handleShowDirectionsTemp}


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
