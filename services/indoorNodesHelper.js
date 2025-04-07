import mapHall1 from '@/api/app/data/campus_jsons/hall/map_hall_1.json';
import mapHall2 from '@/api/app/data/campus_jsons/hall/map_hall_2.json';
import mapHall8 from '@/api/app/data/campus_jsons/hall/map_hall_8.json';
import mapHall9 from '@/api/app/data/campus_jsons/hall/map_hall_9.json';
import mapMB1 from '@/api/app/data/campus_jsons/mb/map_mb_1.json';
import mapMBS2 from '@/api/app/data/campus_jsons/mb/map_mb_s2.json';
import mapCC1 from '@/api/app/data/campus_jsons/cc/map_cc_1.json';
import mapVL1 from '@/api/app/data/campus_jsons/vl/map_vl_1.json';
import mapVL2 from '@/api/app/data/campus_jsons/vl/map_vl_2.json';
import mapVE2 from '@/api/app/data/campus_jsons/vl/map_ve.json';
import { floorsData } from '@/constants/floorData';
import { Platform } from 'react-native';

// Floor-to-JSON mapping for each building
const floorMap = {
    Hall: { 1: mapHall1, 2: mapHall2, 8: mapHall8, 9: mapHall9 },
    MB: { S1: mapMB1, S2: mapMBS2 },
    CC: { 1: mapCC1 },
    VL: { 1: mapVL1, 2: mapVL2, 3: mapVE2 },
};

export const getPathFromNodes = (nodeIds, buildingKey, selectedFloorKey) => {
    const coordinates = nodeIds
        .map((nodeId) => {
            const floorData = floorMap[buildingKey]?.[selectedFloorKey];
            const node = floorData?.nodes.find((n) => n.id === nodeId);
            const yDif = buildingKey === 'CC' ? 746 : 1132;
            return node ? `${node.x},${yDif - node.y}` : null;
        })
        .filter(Boolean);
    return coordinates.length ? `M${coordinates.join(' L')}` : '';
};

export const getNodeData = (nodeId, buildingKey) => {
    const allNodes = Object.values(floorMap[buildingKey] || {}).flatMap((floor) => floor.nodes);
    return allNodes.find((n) => n.id === nodeId) || null;
};

export const getNodeDataRefID = (nodeId, buildingKey) => {
    const section = getNodeDataFullNode(nodeId, buildingKey);
    return section?.ref_ID || null;
};

export const getNodeDataFullNode = (nodeId, buildingKey) => {
    const buildingFloors = floorsData[buildingKey] || {};
    return Object.values(buildingFloors)
        .flatMap((floor) => floor.sections || [])
        .find((s) => s.id === nodeId) || null;
};

const checkNodeInFloorData = (nodeId, buildingKey) => {
    const buildingFloors = floorsData[buildingKey] || {};
    return Object.values(buildingFloors).some((floor) =>
        (floor.sections || []).some((section) => section.id === nodeId)
    );
};

export const getIndoorPath = async (startLocationIndoor, endId, buildingKey, accessibilityOption) => {
    if (!checkNodeInFloorData(startLocationIndoor, buildingKey) || !checkNodeInFloorData(endId.id, buildingKey)) {
        return null;
    }

    const startRefId = getNodeDataRefID(startLocationIndoor, buildingKey);
    const endRefId = endId.ref_ID;

    if (!startRefId || !endRefId || startRefId === endRefId) return null;

    try {
        const host = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
        const response = await fetch(
            `http://${host}:5000/indoorNavigation?startId=${startRefId}&endId=${endRefId}&campus=${buildingKey}&accessibility=${accessibilityOption}`
        );
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        return data.path?.path || null;
    } catch (error) {
        console.error('Failed to fetch indoor path:', error);
        return null;
    }
};

export const getMultiFloorMessage = (nodeIds, buildingKey) => {
    const floorChanges = [];
    let lastFloor = null;

    nodeIds.forEach((nodeId) => {
        const node = getNodeData(nodeId, buildingKey);
        if (node) {
            const currentFloor = node.floor_number;
            if (lastFloor !== null && currentFloor !== lastFloor) {
                floorChanges.push({
                    transitionNode: node,
                    previousFloor: lastFloor,
                    newFloor: currentFloor,
                });
            }
            lastFloor = currentFloor;
        }
    });

    return floorChanges.length
        ? 'There are floor changes in your path, you need to go:\n' +
        floorChanges
            .map((change) => `  - From floor ${change.previousFloor} to floor ${change.newFloor} using ${change.transitionNode.poi_type}`)
            .join('\n')
        : '';
};

export const getBuildingFromSectionId = (sectionId) => {
    for (const buildingKey in floorsData) {
        if (
            Object.values(floorsData[buildingKey]).some((floor) =>
                (floor.sections || []).some((section) => section.id === sectionId)
            )
        ) {
            return buildingKey;
        }
    }
    return null;
};

export const getEntranceFromBuilding = (building) => {
    const buildingToEntranceMap = {
        Hall: 'Hall Building Entrance',
        MB: 'Escalator to S2',
        CC: 'Stairs and Entrance',
        VL: 'Vanier Library Entrance',
    };
    return buildingToEntranceMap[building] || '';
};