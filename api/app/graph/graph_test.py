import pytest
from Graph2 import Graph
from pathlib import Path
import os

@pytest.fixture(scope="module")
def graph():
    from api.app.graph.Graph2 import Graph  # adjust this to your actual import
    SCALE_FACTOR_METERS_PER_UNIT = 0.05
    graph = Graph(scale_factor=SCALE_FACTOR_METERS_PER_UNIT)

    current_directory = Path(os.getcwd())

    # Always reset to project root (assuming this file is in `api/app/graph/`)
    project_root = current_directory
    if 'graph' in current_directory.parts:
        while project_root.name != 'Project':  # or the name of your root dir
            project_root = project_root.parent

    file_path = project_root / 'api/app/data/campus_jsons/hall'
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
    neighbors = graph.get_neighbors("h1_stairs_up_2")
    assert "h2_stairs_to_h1" in neighbors

if __name__ == '__main__':
    pytest.main(['-v', os.path.abspath(__file__)])