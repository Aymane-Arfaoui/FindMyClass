import {
    getPathFromNodes,
    getNodeData,
    getNodeDataRefID,
    getIndoorPath,
    getMultiFloorMessage
} from '../indoorNodesHelper';
jest.mock('@/api/app/data/campus_jsons/hall/map_hall_1.json', () => ({
    nodes: [
        { id: "h1_entrance", x: 282.71, y: 50.12, floor_number: "1", poi_type: "entrance" },
        { id: "h1_102_7", x: 523.44, y: 83.19, floor_number: "1", poi_type: "room" },
        { id: "h1_escalator_to_tunnel", x: 775.2, y: 92.38, floor_number: "1", poi_type: "escalator" },
        { id: "h1_110", x: 350.7, y: 261.45, floor_number: "1", poi_type: "room" },
        { id: "h1_node1", x: 100, y: 200, floor_number: "1" },
        { id: "h1_node2", x: 150, y: 250, floor_number: "1" }
    ]
}));

jest.mock('@/api/app/data/campus_jsons/hall/map_hall_2.json', () => ({
    nodes: [
        { id: "h2_elevator", x: 679.65, y: 239.4, floor_number: "2", poi_type: "elevator" },
        { id: "h2_escalator_to_h2", x: 756.83, y: 232.05, floor_number: "2", poi_type: "escalator" },
        { id: "h2_stairs_to_h1", x: 799.09, y: 232.05, floor_number: "2", poi_type: "stairs" },
        { id: "h2_node1", x: 200, y: 300, floor_number: "2" },
        { id: "h2_node2", x: 250, y: 350, floor_number: "2" }
    ]
}));
jest.mock('@/api/app/data/campus_jsons/hall/map_hall_8.json', () => ({
    nodes: [
        { id: "h8_node1", x: 300, y: 400, floor_number: "8" }
    ]
}));

jest.mock('@/api/app/data/campus_jsons/hall/map_hall_9.json', () => ({
    nodes: [
        { id: "h9_node1", x: 350, y: 450, floor_number: "9" }
    ]
}));
jest.mock('@/api/app/data/campus_jsons/mb/map_mb_1.json', () => ({
    nodes: [
        { id: "mb_1_elevator", x: 499.73, y: 620.27, floor_number: "1", poi_type: "elevator" },
        { id: "mb_1_hw1", x: 407.51, y: 620.27, floor_number: "1", poi_type: "hallway" },

    ]
}));

jest.mock('@/api/app/data/campus_jsons/mb/map_mb_s2.json', () => ({
    nodes: [
        { id: "mb_s2_hw1", x: 671.55, y: 920.45, floor_number: "S2", poi_type: "hallway" },
        { id: "mb_s2_273", x: 637.47, y: 955.95, floor_number: "S2", poi_type: "room" },
        { id: "mb_s2_node1", x: 400, y: 500, floor_number: "S2", poi_type: "room"}
    ]
}));
jest.mock('@/api/app/data/campus_jsons/mb/map_mb_1.json', () => ({
    nodes: [
        { id: "mb_s1_node1", x: 450, y: 550, floor_number: "S1" }
    ]
}));
jest.mock('@/api/app/data/campus_jsons/cc/map_cc_1.json', () => ({
    nodes: [
        { id: "cc_122", x: 319.25, y: 421.33, floor_number: "1", poi_type: "room" },
        { id: "cc_hw3", x: 383.94, y: 376.17, floor_number: "1", poi_type: "hallway" },
        { id: "cc_1_node1", x: 500, y: 600, floor_number: "1" }
    ]
}));

jest.mock('@/constants/floorData', () => ({
    floorsData: {
        Hall: {
            1: {
                sections: [
                    { id: "h1_entrance", ref_ID: "H1_ENTRANCE" },
                    { id: "h1_102_7", ref_ID: "H1_102_7" }
                ]
            },
            2: {
                sections: [
                    { id: "h2_elevator", ref_ID: "H2_ELEV" },
                    { id: "h2_stairs_to_h1", ref_ID: "H2_STAIRS" }
                ]
            }
        },
        MB: {
            1: {
                sections: [
                    { id: "mb_1_elevator", ref_ID: "MB1_ELEV" }
                ]
            },
            S2: {
                sections: [
                    { id: "mb_s2_hw1", ref_ID: "MBS2_hw1" },
                    { id: "mb_s2_273", ref_ID: "MBS2_273" }
                ]
            }
        },
        CC: {
            1: {
                sections: [
                    { id: "cc_122", ref_ID: "CC1_122" },
                    { id: "cc_120", ref_ID: "CC1_120" }
                ]
            }
        }
    }
}));

// Mock platform and fetch
jest.mock('react-native', () => ({
    Platform: {
        OS: 'ios'
    }
}));

global.fetch = jest.fn();

describe('Path Utilities', () => {
    beforeEach(() => {
        fetch.mockClear();
    });

    describe('getPathFromNodes', () => {
        // Test all Hall building floors
        describe('Hall Building', () => {
            it('should generate path for floor 1 nodes', () => {
                const path = getPathFromNodes(['h1_node1', 'h1_node2'], 'Hall', 1);
                expect(path).toBe('M100,932 L150,882');
            });

            it('should generate path for floor 2 nodes', () => {
                const path = getPathFromNodes(['h2_node1', 'h2_node2'], 'Hall', 2);
                expect(path).toBe('M200,832 L250,782');
            });

            it('should generate path for floor 8 nodes', () => {
                const path = getPathFromNodes(['h8_node1'], 'Hall', 8);
                expect(path).toBe('M300,732');
            });

            it('should generate path for floor 9 nodes', () => {
                const path = getPathFromNodes(['h9_node1'], 'Hall', 9);
                expect(path).toBe('M350,682');
            });

            it('should filter invalid nodes for Hall building', () => {
                const path = getPathFromNodes(['h1_node1', 'invalid_node'], 'Hall', 1);
                expect(path).toBe('M100,932');
            });
        });

        // Test MB building
        describe('MB Building', () => {
            it('should generate path for S2 floor nodes', () => {
                const path = getPathFromNodes(['mb_s2_node1'], 'MB', 'S2');
                expect(path).toBe('M400,632');
            });

            it('should generate path for S1 floor nodes', () => {
                const path = getPathFromNodes(['mb_s1_node1'], 'MB', 'S1');
                expect(path).toBe('M450,582');
            });

            it('should return empty path for invalid floor', () => {
                const path = getPathFromNodes(['mb_s2_node1'], 'MB', 'invalid_floor');
                expect(path).toBe('M');
            });
        });

        // Test CC building
        describe('CC Building', () => {
            it('should generate path for floor 1 nodes', () => {
                const path = getPathFromNodes(['cc_1_node1'], 'CC', '1');
                expect(path).toBe('M500,146');
            });

            it('should return empty path for invalid floor', () => {
                const path = getPathFromNodes(['cc_1_node1'], 'CC', '2');
                expect(path).toBe('M');
            });
        });

        // Edge cases
        describe('Edge Cases', () => {
            it('should return empty path for empty nodeIds array', () => {
                const path = getPathFromNodes([], 'Hall', 1);
                expect(path).toBe('M');
            });

            it('should return empty path for invalid building', () => {
                const path = getPathFromNodes(['h1_node1'], 'InvalidBuilding', 1);
                expect(path).toBe('M');
            });

            it('should handle mixed valid and invalid nodes', () => {
                const path = getPathFromNodes(
                    ['h1_node1', 'invalid_node', 'h1_node2'],
                    'Hall',
                    1
                );
                expect(path).toBe('M100,932 L150,882');
            });

        });

        // Coordinate transformation verification
        describe('Coordinate Transformation', () => {
            it('should correctly calculate yDif for Hall building', () => {
                const path = getPathFromNodes(['h1_node1'], 'Hall', 1);
                // y = 1132 - 200 = 932
                expect(path).toBe('M100,932');
            });

            it('should correctly calculate yDif for MB building', () => {
                const path = getPathFromNodes(['mb_s2_node1'], 'MB', 'S2');
                // y = 1132 - 500 = 632
                expect(path).toBe('M400,632');
            });

            it('should correctly calculate yDif for CC building', () => {
                const path = getPathFromNodes(['cc_1_node1'], 'CC', '1');
                // y = 746 - 600 = 146
                expect(path).toBe('M500,146');
            });
        });
    });

    describe('getNodeData', () => {
        it('finds node in Hall building', () => {
            const node = getNodeData('h1_entrance', 'Hall');
            expect(node).toEqual({
                id: "h1_entrance",
                x: 282.71,
                y: 50.12,
                floor_number: "1",
                poi_type: "entrance"
            });
        });

        it('finds node in CC building', () => {
            const node = getNodeData('cc_122', 'CC');
            expect(node).toEqual({
                id: "cc_122",
                x: 319.25,
                y: 421.33,
                floor_number: "1",
                poi_type: "room"
            });
        });

        it('returns null for non-existent node', () => {
            const node = getNodeData('invalid_node', 'Hall');
            expect(node).toBeFalsy();
        });
    });

    describe('getNodeDataRefID', () => {
        it('returns correct ref ID for Hall node', () => {
            const refId = getNodeDataRefID('h1_entrance', 'Hall');
            expect(refId).toBe('H1_ENTRANCE');
        });

        it('returns null for hallway (no ref ID)', () => {
            const refId = getNodeDataRefID('mb_1_hw1', 'MB');
            expect(refId).toBeNull();
        });
    });

    describe('getIndoorPath', () => {
        it('fetches path when nodes exist in floor data', async () => {
            fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ path: { path: ['h1_entrance', 'H1_102_7'] } })
            });

            const path = await getIndoorPath(
                'h1_entrance',
                { id: 'h1_102_7', ref_ID: 'H1_102_7' },
                'Hall'
                ,false
            );
            expect(path).toEqual(['h1_entrance', 'H1_102_7']);
            expect(fetch).toHaveBeenCalledWith(
                'http://127.0.0.1:5000/indoorNavigation?startId=H1_ENTRANCE&endId=H1_102_7&campus=Hall&accessibility=false'
            );
        });

        it('returns null when nodes not in floor data', async () => {
            const path = await getIndoorPath(
                'h1_escalator_to_tunnel',
                { id: 'mb_1_hw1' },
                'Hall'
            );
            expect(path).toBeNull();
        });
    });

    describe('getMultiFloorMessage', () => {
        it('returns message for floor changes', () => {
            const message = getMultiFloorMessage(
                ['h1_escalator_to_tunnel', 'h2_elevator'],
                'Hall'
            );
            expect(message).toContain('From floor 1 to floor 2');
            expect(message).toContain('elevator');
        });

        it('returns empty string for single floor path', () => {
            const message = getMultiFloorMessage(
                ['h1_entrance', 'h1_102_7'],
                'Hall'
            );
            expect(message).toBe('');
        });
    });
});