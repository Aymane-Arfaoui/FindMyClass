import React, {useEffect, useRef, useState} from 'react';
import {
    Alert,
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


import mapHall1 from '../api/app/data/campus_jsons/hall/map_hall_1.json';
import mapHall2 from '../api/app/data/campus_jsons/hall/map_hall_2.json';
import mapHall8 from '../api/app/data/campus_jsons/hall/map_hall_8.json';
import mapHall9 from '../api/app/data/campus_jsons/hall/map_hall_9.json';

import mapMB1 from '../api/app/data/campus_jsons/mb/map_mb_1.json';
import mapMBS2 from '../api/app/data/campus_jsons/mb/map_mb_s2.json';

import mapCC1 from '../api/app/data/campus_jsons/cc/map_cc_1.json';


import IndoorSearchBars from "@/components/IndoorSearchBars";
import IndoorSearchBar from "@/components/IndoorSearchBar";
import {useRouter} from "expo-router";
import PropTypes from "prop-types";


const MapScreen = () => {

    const router = useRouter();

    const route = useRoute();
    const navigation = useNavigation();

    // const {buildingKey, classroomNum} = route.params || {};
    let {buildingKey} = route.params || {};
    const [classroomNum, setClassroomNum] = useState(route.params?.classroomNum || '');

    const [selectedSection, setSelectedSection] = useState(null);
    const [destinationIndoor, setDestinationIndoor] = useState(
        (classroomNum && classroomNum !== "") ? classroomNum : selectedSection?.id || ""
    );
    // const [showSearchBar, setShowSearchBar] = useState(false);

    const [showSearchBar, setShowSearchBar] = useState(!!classroomNum);
    const [startLocationIndoor, setStartLocationIndoor] = useState("");
    const [startLocationIndoorTemp, setStartLocationIndoorTemp] = useState("");


    if (!buildingKey || !floorsData[buildingKey]) {
        return (
            <View style={styles.container}>
                <Text style={styles.noDataText}>No indoor map data available for this building.</Text>
            </View>
        );
    }

    useEffect(() => {
        if (classroomNum && classroomNum !== "") {
            // setStartLocationIndoor(classroomNum);
            // setStartLocationIndoor(startLocationIndoor);
            console.log("classroomNumclassroomNumclassroomNumclassroomNumclassroomNum")
            console.log(classroomNum)
            // const initialSection = sections.find(section => section.id === classroomNum);

            const initialSection = getNodeDataFullNode(classroomNum);

            console.log("initialSection ****** initialSection")
            console.log(initialSection)

            // if (getNodeDataFullNode(classroomNum)) {
            if (initialSection) {
                // setSelectedSection(initialSection);
                handleShowDirectionsSection(initialSection, "start");

            } else {
                console.warn(`No section found for classroomNum: ${classroomNum}`);
            }
        }
    }, [classroomNum]);


    const buildingFloors = floorsData[buildingKey];
    const floorKeys = Object.keys(buildingFloors);
    const [selectedFloorKey, setSelectedFloorKey] = useState(floorKeys[0]);
    const selectedFloorData = buildingFloors[selectedFloorKey];
    const {viewBox, sections = [], poiImage, width, height} = selectedFloorData;
    const aspectRatio = width / height;
    const panelY = useRef(new Animated.Value(0)).current;

    const [multiFloorMessage, setMultiFloorMessage] = useState(null);

    const [switchedBuilding, setSwitchedBuilding] = useState(false);


    const [isSwitchToOutdoor, setIsSwitchToOutdoor] = useState(false);
    const [switchStartBuilding, setSwitchStartBuilding] = useState(null);
    const [switchEndBuilding, setSwitchEndBuilding] = useState(null);
    const [switchEndClassroom, setSwitchEndClassroom] = useState(null);


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
        console.log("HANDLE PRESS 777777HANDLE PRESS 777777HANDLE PRESS 777777HANDLE PRESS 777777 ");
        console.log(section);
        console.log(section.id);
        setSelectedSection(section);
        console.log("selectedSection: " + selectedSection?.id);
        console.log("selectedSection: " + selectedSection?.id);
        console.log("selectedSection: " + selectedSection?.id);
        console.log("selectedSection: " + selectedSection?.id);
        console.log("selectedSection: " + selectedSection?.id);
        console.log("selectedSection: " + selectedSection?.id);

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
            if (buildingKey == 'Hall'){
                if (selectedFloorKey == "1") {
                    node = mapHall1.nodes.find(n => n.id === nodeId);
                }
                else if (selectedFloorKey == "2"){
                    node = mapHall2.nodes.find(n => n.id === nodeId);
                }
                else if (selectedFloorKey == "8"){
                    node = mapHall8.nodes.find(n => n.id === nodeId);
                }
                else if (selectedFloorKey == "9"){
                    node = mapHall9.nodes.find(n => n.id === nodeId);
                }
                yDif = 1132;
            }

            else if (buildingKey == "MB"){
                if (selectedFloorKey == 1) {
                    node = mapMB1.nodes.find(n => n.id === nodeId);
                }
                else if (selectedFloorKey == 0){
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

        console.log("nodeId111111111")
        console.log(nodeId)
        console.log("buildingFloors11111111")
        console.log(buildingKey)
        // console.log(buildingFloors)

        Object.values(buildingFloors).forEach(floor => {
            const section = floor.sections.find(s => s.id === nodeId);
            if (section) {
                foundSection = section;
                console.log("foundSectionfoundSectionfoundSectionfoundSectionfoundSectionfoundSection")
                console.log(foundSection)

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

    const getNodeDataFullNode = (nodeId) => {
        const buildingFloors = floorsData[buildingKey];
        let foundSection = null;

        console.log("nodeId1222222222222")
        console.log(nodeId)
        console.log("buildingFloors1222222222222")
        console.log(buildingKey)
        // console.log(buildingFloors)

        Object.values(buildingFloors).forEach(floor => {
            const section = floor.sections.find(s => s.id === nodeId);
            if (section) {
                foundSection = section;
                console.log("foundSectionf2222222oundSectionfoundSectionf222222oundSectionfoundSectionfoundSection2222222222")
                console.log(foundSection)

            }
        });


        if (foundSection) {
            if(foundSection !== ""){
                return foundSection;
            }
        }
        return null;
    };


    const transformId = (id) => {
        const [letter, number] = id.split("-");
        const floorNumber = number.charAt(0);
        return `${letter.toLowerCase()}${floorNumber}_${number}`;
    };

    const getFromFloorData = (nodeId, building) => {
        // const buildingFloors = floorsData[buildingKey]; //HERE IT IS (FIRST ONE, ORIGINAL) From main

        const buildingFloors = floorsData[building]; //HERE IT IS
        // const buildingFloors = floorsData[..."MB", ..."Hall", ..."CC"]; //HERE IT IS


        console.log("buildingFloors")
        // console.log(buildingFloors.buildingKey)
        // console.log(buildingFloors)
        console.log("nodeIdnodeIdnodeIdnodeIdnodeIdnodeIdnodeId")
        console.log(nodeId)
        console.log("8888888888888888888888")
        console.log(building)


        if (!buildingFloors) {
            return false;
        }

        return Object.values(buildingFloors).some(floor => {
            console.log("floor.sections.some(section => section.id === nodeId) // Ture or false")
            console.log(floor.sections.some(section => section.id === nodeId))
            return floor.sections.some(section => section.id === nodeId);
        });
    };

    const checkNodeInFloorData = (nodeId) => {
        return getFromFloorData(nodeId);
    };
    const checkNodeInFloorData2 = (nodeId, building) => {
        if (getFromFloorData(nodeId, building)) {
            // console.log(`Node ${nodeId} exists in floor data`);
            return true
        } else {
            // console.log(`Node ${nodeId} does not exist in floor data`);
            return false
        }
    };

    const getBuildingFromNodeId = (nodeId) => {
        // selectedFloorKey
        // selectedSection,
        //     selectedFloorData
        console.log("selectedFloorKey")
        console.log(selectedFloorKey)
        console.log("selectedSection")
        console.log(selectedSection)
        console.log("selectedFloorData")
        console.log(selectedFloorData)


        for (const building in floorsData) {
            const buildingFloors = floorsData[building];
            for (const floor in buildingFloors) {
                const section = buildingFloors[floor].sections.find(s => s.id === nodeId);
                if (section) return building;
            }
        }
        return null;
    };


    const getBuildingFromSectionId = (sectionId) => {
        for (const buildingKey in floorsData) {
            const buildingFloors = floorsData[buildingKey];
            for (const floorKey in buildingFloors) {
                if (buildingFloors[floorKey].sections.some(section => section.id === sectionId)) {
                    return buildingKey;
                }
            }
        }
        return null;
    };




    const handleShowDirectionsSection = async (endId, startIdIndoor = "") => {

        console.log("startLocationIndoor: " + startLocationIndoor)
        console.log("endId.id: " + endId.id)
        console.log("**************************************:")

        const endBuilding1 = getBuildingFromSectionId(endId.id);

        let startLocationId;

        if (endBuilding1 === 'Hall') {
            startLocationId = "Hall Building Entrance";
        } else if (endBuilding1 === "MB") {
            startLocationId = "Escalator to S2";
        } else if (endBuilding1 === "CC") {
            startLocationId = "Stairs and Entrance";
        }


        let effectiveStartLocation = "";
        // if (startIdIndoor === ""){
        //     effectiveStartLocation  = startLocationIndoor;
        //     setStartLocationIndoorTemp(startLocationIndoor);
        // }else{
        //     effectiveStartLocation = startLocationId;
        //     // effectiveStartLocation = "Stairs and Escalator to the Tunnel";
        // }

        console.log("startIdIndoor555555555555555555555: " + startIdIndoor)
        console.log("classroomNum555555555555555555: " + classroomNum)


        if (startIdIndoor === ""){
            console.log("555555555555555555555: Option 1")
            console.log("startLocationIndoor555555555555555555555: " + startLocationIndoor)

            if(startLocationIndoor === "Entrance") {
                if(endBuilding1 === 'Hall'){
                    effectiveStartLocation = "Hall Building Entrance";
                    setStartLocationIndoorTemp("Hall Building Entrance");
                } else if (endBuilding1 === "MB") {
                    effectiveStartLocation = "Escalator to S2";
                    setStartLocationIndoorTemp("Escalator to S2");
                } else if (endBuilding1 === "CC") {
                    effectiveStartLocation = "Stairs and Entrance";
                    setStartLocationIndoorTemp("Stairs and Entrance");
                }
            }
            else{
                effectiveStartLocation = startLocationIndoor;
                setStartLocationIndoorTemp(startLocationIndoor);
            }
        }else{
            console.log("555555555555555555555: Option 2")

            effectiveStartLocation = startLocationId;
            // effectiveStartLocation = "Stairs and Escalator to the Tunnel";
        }

        console.log("effectiveStartLocation8888888 effectiveStartLocation8888888 effectiveStartLocation8888888 :")
        console.log(effectiveStartLocation)

        const startBuilding1 = getBuildingFromSectionId(effectiveStartLocation);


        console.log("startBuilding1:" + startBuilding1)
        console.log("endBuilding1:" + endBuilding1)

        // if(checkNodeInFloorData(startLocationIndoor) && checkNodeInFloorData(endId.id)){
        if(checkNodeInFloorData2(effectiveStartLocation, startBuilding1) && checkNodeInFloorData2(endId.id, endBuilding1)){

            const startBuilding = getBuildingFromSectionId(effectiveStartLocation);
            const endBuilding = getBuildingFromSectionId(endId.id);

            console.log("startBuilding:" + startBuilding)
            console.log("endBuilding:" + endBuilding)


            if (startBuilding !== endBuilding) {
                // Alert.alert(
                //     "Navigation Error",
                //     "Cross-building navigation is not supported at the moment.",
                //     [{ text: "OK", onPress: () => console.log("OK Pressed") }]
                // );

                console.log("HEREWECHANGEHEREWECHANGEHEREWECHANGEHEREWECHANGEHEREWECHANGE")

                setShowSearchBar(false);
                setMultiFloorMessage("")
                setSelectedPath(null)
                // setStartLocationIndoor("")
                setPath(null);
                // closeIndoorSearchBars(false);

                console.log("1: " + showSearchBar);
                console.log("2: " + multiFloorMessage);
                console.log("3: " + selectedPath);
                console.log("4: " + startLocationIndoor);
                console.log("5: " + path);

                console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++")


                console.log("REMOVE BEFOREEEEEEEEE: buildingKey: " + buildingKey)
                // buildingKey = "MB"


                const buildingKey222 = "MB";

                console.log("REMOVE NOWWWWWWWWWWWWW: buildingKey: " + buildingKey222)
                console.log("REMOVE NOWWWWWWWWWWWWW: floorKey: " + selectedFloorData.floorKey)
                console.log("REMOVE NOWWWWWWWWWWWWW: floorKey 2 : " + selectedFloorKey)
                console.log("REMOVE NOWWWWWWWWWWWWW: startBuilding : " + startBuilding)
                console.log("REMOVE NOWWWWWWWWWWWWW: endBuilding : " + endBuilding)
                console.log("REMOVE NOWWWWWWWWWWWWW: endId.id : " + endId.id)


                setSwitchStartBuilding(startBuilding);
                setSwitchEndBuilding(endBuilding);
                setSwitchEndClassroom(endId.id);

                setSwitchedBuilding(true);
                setIsSwitchToOutdoor(true);

                // navigation.navigate("MapScreen", { buildingKey });

                navigation.navigate("MapScreen", {
                    buildingKey: startBuilding,
                    // floorKey: "1",
                });
                console.log("REMOVE NOWWWWWWWWWWWWW: switchedBuilding : " + switchedBuilding)

                // navigation.navigate("MapScreen", {
                //     buildingKey: startBuilding,
                //     floorKey: "1",
                //     startClassroom: effectiveStartLocation,
                //     destinationClassroom: "H-260",
                //     classroomNum: classroomNum
                // });


                // navigation.navigate("MapScreen", {
                //     buildingKey: result.buildingKey,
                //     floorKey: result.floorKey,
                //     section: result.section
                // });


                //Switch to outdoor section
                // navigation.navigate('homemap', {
                //     startBuilding: startBuilding,
                //     endBuilding: endBuilding,
                //     triggerRoute: true,
                //     destinationClassroom: endId.id,
                // });

                console.log("=====================================================")

                // closeIndoorSearchBars(false);


                return;
            }

            const transformedStartLocationIndoor = getNodeDataRefID(effectiveStartLocation)
            const transformedEndId = endId.ref_ID;
            // const transformedStartLocationIndoor = "h1_128";
            // const transformedEndId = "h1_110";



            console.log("transformedStartLocationIndoor585858transformedStartLocationIndoor585858transformedStartLocationIndoor585858")
            console.log(transformedStartLocationIndoor)
            console.log("transformedEndId585858transformedEndId585858transformedEndId585858")
            console.log(transformedEndId)

            if ((transformedStartLocationIndoor && transformedEndId) && (transformedStartLocationIndoor !== transformedEndId)) {
                try {
                    console.log("SENDING REQUEST SENDING REQUEST SENDING REQUEST SENDING REQUEST SENDING REQUEST SENDING REQUEST ")
                    console.log(transformedStartLocationIndoor)
                    console.log(transformedEndId)
                    const response = await fetch(
                        `http://10.0.2.2:5000/indoorNavigation?startId=${transformedStartLocationIndoor}&endId=${transformedEndId}&campus=${buildingKey}`
                    );http://127.0.0.1:5000/indoorNavigation?startId=h2_209&endId=h2_260&campus=hall

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
            else{
                console.log("1NOT YET!!!!!!")
                console.log("startBuilding " + startBuilding)
                console.log("endBuilding " + endBuilding)

                console.log("2NOT YET!!!!!!")
            }


        }
        else{
            const aa = endId.id;
            console.log("NO!!!!!!")
        }

    };

    const handleShowDirectionsTemp = () => {
        setShowSearchBar(true);
    };

    useEffect(() => {
        console.log("classroomNum 1 " + classroomNum)
        console.log("startLocationIndoor 1 " + startLocationIndoor)
        console.log("selectedSection 1 " + selectedSection?.id)

        // classroomNum = "";
        // setClassroomNum("")
        console.log("USE EFFECT 2 OPENED NOW")
        console.log("classroomNum 2 " + classroomNum)
        console.log("startLocationIndoor 2 " + startLocationIndoor)

        console.log("//////////////////////////////////////////////////")
        console.log(startLocationIndoor)
        console.log(selectedSection?.id)
        console.log(startLocationIndoor)
        console.log(showSearchBar)

        setDestinationIndoor(
            (classroomNum && classroomNum !== "") ? classroomNum : selectedSection?.id || ""
        );

        if (startLocationIndoor && selectedSection?.id && startLocationIndoor !== "" && showSearchBar) {
            console.log("USE EFFECT 2 WORKING NOW //////////////////////////////////////////////////")

            console.log("selectedSection 2 " + selectedSection?.id + ", " + selectedSection?.ref_ID)

            handleShowDirectionsSection(selectedSection);
            handleShowDirectionsTemp();
        }
    }, [startLocationIndoor, selectedSection?.id, selectedSection]); // consider adding buildingKey as a dependency? Look into it later.

    useEffect(() => {
        console.log("!!!!!!!!!!!!!!!!!! BUILDING KEY HAS CHANGED HERE !!!!!!!!!!!!!!!!!!!!!")
    }, [buildingKey]);

    useEffect(() => {
        if (switchedBuilding === true){
            console.log("@@@@@@@@@@@@@@@@@@@@@@ switchedBuilding HAS CHANGED HERE @@@@@@@@@@@@@@@@@@@@@@ it is now: " + switchedBuilding);
            console.log("@@destinationIndoor@@@@" + destinationIndoor);

            let tempDestinationRoom;

            if(buildingKey === 'Hall'){
                tempDestinationRoom = "Hall Building Exit";
            } else if (buildingKey === "MB") {
                tempDestinationRoom = "MB Building Exit";
            } else if (buildingKey === "CC") {
                tempDestinationRoom = "CC Building Exit";
            }

            const tempSectionNewBuilding = getNodeDataFullNode(tempDestinationRoom);

            setShowSearchBar(true);
            setMultiFloorMessage("");
            setSelectedPath(null);
            setPath(null);;
            setClassroomNum(tempDestinationRoom);
            setSelectedSection(tempSectionNewBuilding);
            setDestinationIndoor(tempDestinationRoom);
            setIsSwitchToOutdoor(true);

            setShowSearchBar(true);

            // handleShowDirectionsSection(tempSectionNewBuilding);

            // setSwitchedBuilding(false);

            console.log("@@destinationIndoor@@@@" + destinationIndoor);
            console.log("@@tempSectionNewBuilding@@@@" + tempSectionNewBuilding.id);

            console.log("@@@@@@@@@@ switchedBuilding HAS CHANGED BACK @@@@@@@@@@ it is now: " + switchedBuilding);
        }
        // else if(switchedBuilding === false){
        //     setIsSwitchToOutdoor(false);
        // }

    }, [switchedBuilding]);

    // useEffect(() => {
    //     setDestinationIndoor(
    //         (classroomNum && classroomNum !== "") ? classroomNum : selectedSection?.id || ""
    //     );
    // }, [classroomNum, selectedSection]);


    const closeIndoorSearchBars = () => {
        setShowSearchBar(false);
        setMultiFloorMessage("");
        setSelectedPath(null);
        setStartLocationIndoor("");
        setPath(null);
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            {/*<TouchableWithoutFeedback onPress={() => setSelectedSection(null)}>*/}
            <TouchableWithoutFeedback>
                <View style={styles.container}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    {/*<TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('homemap')}>*/}
                    {/*<TouchableOpacity style={styles.backButton} onPress={() => navigation.reset({*/}
                    {/*    index: 0,*/}
                    {/*    routes: [{ name: 'homemap' }],*/}
                    {/*})}>*/}
                        <Ionicons name="chevron-back" size={28} color={theme.colors.dark}/>
                    </TouchableOpacity>

                    {showSearchBar && (

                        <IndoorSearchBars
                            startLocation={classroomNum ? "Entrance" : startLocationIndoor}
                            setStartLocation={setStartLocationIndoor}


                            onShowDirectionsUpdate={() => handleShowDirectionsSection(selectedSection)}
                            onShowDirectionsUpdateTemp={handleShowDirectionsTemp}

                            // destination={(classroomNum && classroomNum !=="") ?  classroomNum : selectedSection?.id}
                            destination={destinationIndoor}
                            onBackPress={() => closeIndoorSearchBars(false)}

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
                        boolSwitchToOutdoor={isSwitchToOutdoor}
                        switchStartBuilding={switchStartBuilding}
                        switchEndBuilding={switchEndBuilding}
                        switchEndClassroom={switchEndClassroom}

                    />
                </View>
            </TouchableWithoutFeedback>
        </GestureHandlerRootView>
    );
};

MapScreen.propTypes={
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
