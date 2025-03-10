import unittest
from Graph import Graph

class TestGraph(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.SCALE_FACTOR_METERS_PER_UNIT = 0.05
        cls.graph = Graph(scale_factor=cls.SCALE_FACTOR_METERS_PER_UNIT)
        cls.graph.load_from_json_folder('api/app/data/campus_jsons/hall')

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

        print(f"\nShortest path from {start_node} to {end_node}: {result['path']}")
        print(f"Total distance: {result['distance']:.2f} meters")
        
        self.assertIsNotNone(result)
        self.assertEqual(result['path'], expected_result)

    def test_find_shortest_path_nonexistent(self):
        result = self.graph.find_shortest_path("invalid_start", "invalid_end")
        self.assertIsNone(result)

    def test_yen_k_shortest_paths(self):
        start_node = "h2_209"
        end_node = "h2_260"
        
        top_paths = self.graph.yen_k_shortest_paths(start_node, end_node)
        
        self.assertGreaterEqual(len(top_paths), 1)
        
    def test_multifloor_stairh1_to_h2(self):
        neighbors_of_stairs_h1 = list(self.graph.graph.neighbors("h1_stairs_up_2"))
        
        self.assertIn("h2_stairs_to_h1", neighbors_of_stairs_h1)


if __name__ == '__main__':
    unittest.main()
