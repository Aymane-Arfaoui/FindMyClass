import mapHall1 from "@/api/app/data/campus_jsons/hall/map_hall_1.json";
import mapHall2 from "@/api/app/data/campus_jsons/hall/map_hall_2.json";
import mapHall8 from "@/api/app/data/campus_jsons/hall/map_hall_8.json";
import mapHall9 from "@/api/app/data/campus_jsons/hall/map_hall_9.json";
import mapMB1 from "@/api/app/data/campus_jsons/mb/map_mb_1.json";
import mapMBS2 from "@/api/app/data/campus_jsons/mb/map_mb_s2.json";
import mapCC1 from "@/api/app/data/campus_jsons/cc/map_cc_1.json";
import {floorsData} from "@/constants/floorData";
import {Platform} from "react-native";

export const getPathFromNodes = (nodeIds,buildingKey,selectedFloorKey) => {
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
                node = mapMBS2.nodes.find(n => n.id === nodeId);

            } else if (selectedFloorKey == "S1") {
                node = mapMB1.nodes.find(n => n.id === nodeId);
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

export const   getNodeData = (nodeId, buildingKey) => {
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

export const getNodeDataRefID = (nodeId,buildingKey) => {
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
const checkNodeInFloorData = (nodeId,buildingKey) => {
    return getFromFloorData(nodeId,buildingKey);
};
const getFromFloorData = (nodeId,buildingKey) => {
    const buildingFloors = floorsData[buildingKey];
    if (!buildingFloors) {
        return false;
    }

    return Object.values(buildingFloors).some(floor => {
        return floor.sections.some(section => section.id === nodeId);
    });
};
export const getIndoorPath = async (startLocationIndoor, endId, buildingKey ,accessibilityOption) => {
    if (checkNodeInFloorData(startLocationIndoor,buildingKey) && checkNodeInFloorData(endId.id, buildingKey)) {
        const transformedStartLocationIndoor = getNodeDataRefID(startLocationIndoor,buildingKey)
        const transformedEndId = endId.ref_ID;

        if (transformedStartLocationIndoor && transformedEndId) {
            try {
                const host = Platform.OS === "android" ? "10.0.2.2" : "127.0.0.1";
                const response = await fetch(
                    `http://${host}:5000/indoorNavigation?startId=${transformedStartLocationIndoor}&endId=${transformedEndId}&campus=${buildingKey}&accessibility=${accessibilityOption}`
                );

                if (response.ok) {
                    const data = await response.json();
                    return data.path.path;

                } else {
                    console.error("Error fetching data");
                }
            } catch (error) {
                console.error("Request failed", error);
            }
        }

    }
    return null;
};

export const getMultiFloorMessage=(nodeIds,buildingKey)=>{
    const floorChanges = [];
    let lastFloor = null;

    nodeIds.forEach((nodeId) => {
        const node = getNodeData(nodeId,buildingKey);

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
       return message;
    } else {
        return "";
    }
};