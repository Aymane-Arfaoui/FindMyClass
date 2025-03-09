import unittest
from Graph import load_graph_from_json
import os

class TestGraph(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.SCALE_FACTOR_METERS_PER_UNIT = 0.05
        cls.graph = None
        for root, dirs, files in os.walk('api/app/data/campus_jsons/hall'):
            for file in files:
                if file.endswith('.json'):
                    cls.graph = load_graph_from_json(
                        cls.graph,
                        os.path.join(root, file),
                        scale_factor=cls.SCALE_FACTOR_METERS_PER_UNIT
                    )
    
    def test_find_shortest_path_exists(self):
        start_node = "h2_209"
        end_node = "h2_260"
        result = self.graph.find_shortest_path(start_node, end_node)
        expected_result = [
            "h2_209",
            "h2_hw8",
            "h2_290",
            "h2_hw4",
            "h2_hw3",
            "h2_hw2",
            "h2_260"
        ]

        self.assertIsNotNone(result, f"No path found between {start_node} and {end_node}")
        self.assertIn('path', result)
        self.assertIn('distance', result)
        self.assertEqual(result['path'],expected_result, "Unexpected result for shortest path")

        print(f"\nShortest path from {start_node} to {end_node}: {result['path']}")
        print(f"Total distance: {result['distance']:.2f} meters")

    def test_find_shortest_path_nonexistent(self):
        start_node = "invalid_start"
        end_node = "invalid_end"
        result = self.graph.find_shortest_path(start_node, end_node)

        self.assertIsNone(result, "Expected no path for invalid nodes")

    def test_yen_k_shortest_paths(self):
        start_node = "h2_209"
        end_node = "h2_260"
        K = 3
        top_paths = self.graph.yen_k_shortest_paths(start_node, end_node, K=K)

        self.assertIsInstance(top_paths, list)
        self.assertGreaterEqual(len(top_paths), 1, "Expected at least one path")

        print(f"\nTop {len(top_paths)} shortest paths from '{start_node}' to '{end_node}':")
        for idx, path_info in enumerate(top_paths, start=1):
            print(f"Path {idx}: {' -> '.join(path_info['path'])}")
            print(f"Total Distance: {path_info['distance']:.2f} meters\n")
    
    def test_multifloor_stairh1_to_h2(self):
        result = self.graph.nodes["h1_stairs_up_2"].neighbors
        self.assertIn("h2_stairs_to_h1", result, "Expected stair connection between floors")
        


    # def test_multiple_floor_shortest_path_stairs_to_room(self):
    #     start_node = "h1_141"
    #     end_node = "h2_260"
    #     result = self.graph.find_shortest_path(start_node, end_node)
    #     print(f"multifloor path from {start_node} to {end_node}: {result}")

    #     expected_result = [
    #         "",
    #         ,
    #         "h2_260"
    #     ]

    #     self.assertIsNotNone(result, f"No path found between {start_node} and {end_node}")
    #     self.assertIn('path', result)
    #     self.assertIn('distance', result)
    #     self.assertEqual(result['path'],expected_result, "Unexpected result for shortest path")

    #     print(f"\nShortest path from {start_node} to {end_node}: {result['path']}")
    #     print(f"Total distance: {result['distance']:.2f} meters")




if __name__ == '__main__':
    unittest.main()
