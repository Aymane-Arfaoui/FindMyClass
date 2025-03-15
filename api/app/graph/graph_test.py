import pytest
from Graph2 import Graph
from pathlib import Path
import os

@pytest.fixture(scope="module")
def graph():
    SCALE_FACTOR_METERS_PER_UNIT = 0.05
    graph = Graph(scale_factor=SCALE_FACTOR_METERS_PER_UNIT)
    file_path = Path(f'app/data/campus_jsons/hall')
    graph.load_from_json_folder(file_path)
    return graph

def test_find_shortest_path_exists(graph):
    start_node = "h2_209"
    end_node = "h2_260"
    result = graph.find_shortest_path(start_node, end_node)

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

    assert result is not None
    assert result['path'] == expected_result

def test_find_shortest_path_nonexistent(graph):
    result = graph.find_shortest_path("invalid_start", "invalid_end")
    assert result is None

def test_yen_k_shortest_paths(graph):
    start_node = "h2_209"
    end_node = "h2_260"

    top_paths = graph.yen_k_shortest_paths(start_node, end_node)

    assert len(top_paths) >= 1

def test_multifloor_stairh1_to_h2(graph):
    neighbors_of_stairs_h1 = list(graph.graph.neighbors("h1_stairs_up_2"))

    assert "h2_stairs_to_h1" in neighbors_of_stairs_h1

if __name__ == '__main__':
    pytest.main(['-v', os.path.abspath(__file__)])