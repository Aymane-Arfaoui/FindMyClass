import os
import pytest
from app.graph.graph import Graph, Node, load_graph_from_json  # Assuming necessary imports



# Fixture for loading a graph from JSON files
@pytest.fixture(scope="class")
def graph():
    SCALE_FACTOR_METERS_PER_UNIT = 0.05
    graph = None
    json_files_found = False
    for root, dirs, files in os.walk('./app/data/campus_jsons/hall'):
            for file in files:
                if file.endswith('.json'):
                    json_files_found = True
                    graph = load_graph_from_json(
                        graph,
                        os.path.join(root, file),
                        scale_factor=SCALE_FACTOR_METERS_PER_UNIT
                    )

    #json_dir = os.path.abspath('./app/data/campus_jsons/hall')
    #raise FileNotFoundError(f"Looking for JSON files in: {json_dir}, Current working directory: {os.getcwd()}")     
    if not json_files_found:
        raise FileNotFoundError("No JSON files found in the directory!")

    if graph is None:
        raise ValueError("Failed to load the graph from the JSON files!")
    
    return graph


# Fixture to create a simple graph for unit tests
@pytest.fixture
def simple_graph():
    g = Graph()

    # Add nodes
    node1 = Node(node_id="1", x_svg=0, y_svg=0, floor_number=1, poi_type="type1")
    node2 = Node(node_id="2", x_svg=1, y_svg=0, floor_number=1, poi_type="type2")
    node3 = Node(node_id="3", x_svg=1, y_svg=1, floor_number=1, poi_type="type3")
    node4 = Node(node_id="4", x_svg=0, y_svg=1, floor_number=1, poi_type="type4")

    g.add_node(node1)
    g.add_node(node2)
    g.add_node(node3)
    g.add_node(node4)

    # Add edges between nodes (undirected graph)
    g.add_edge("1", "2")
    g.add_edge("2", "3")
    g.add_edge("3", "4")
    g.add_edge("1", "3")

    return g


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

    assert result is not None, f"No path found between {start_node} and {end_node}"
    assert "path" in result
    assert "distance" in result
    assert result["path"] == expected_result, "Unexpected result for shortest path"

    print(f"\nShortest path from {start_node} to {end_node}: {result['path']}")
    print(f"Total distance: {result['distance']:.2f} meters")


def test_find_shortest_path_nonexistent(graph):
    start_node = "invalid_start"
    end_node = "invalid_end"
    result = graph.find_shortest_path(start_node, end_node)

    assert result is None, "Expected no path for invalid nodes"


def test_yen_k_shortest_paths(graph):
    start_node = "h2_209"
    end_node = "h2_260"
    K = 3
    top_paths = graph.yen_k_shortest_paths(start_node, end_node, K=K)

    assert isinstance(top_paths, list)
    assert len(top_paths) >= 1, "Expected at least one path"

    print(f"\nTop {len(top_paths)} shortest paths from '{start_node}' to '{end_node}':")
    for idx, path_info in enumerate(top_paths, start=1):
        print(f"Path {idx}: {' -> '.join(path_info['path'])}")
        print(f"Total Distance: {path_info['distance']:.2f} meters\n")


def test_multifloor_stairh1_to_h2(graph):
    result = graph.nodes["h1_stairs_up_2"].neighbors
    assert "h2_stairs_to_h1" in result, "Expected stair connection between floors"


# Test for Dijkstra's shortest path using a simple graph
def test_dijkstra_shortest_path(simple_graph):
    result = simple_graph.find_shortest_path("1", "4")
    assert result is not None
    assert result["path"] == ["1", "3", "4"]
    assert result["distance"] == pytest.approx(2.414213562373095, rel=1e-2)


# Test for Yen's K-shortest paths using a simple graph
def test_yen_k_shortest_paths_simple(simple_graph):
    paths = simple_graph.yen_k_shortest_paths("1", "4", K=3)

    assert len(paths) <= 3
    for path in paths:
        assert path["distance"] > 0
        assert len(path["path"]) > 1


# Test for the Graph structure (ensuring that nodes and edges are added properly)
def test_graph_structure(simple_graph):
    # Check if nodes are properly added
    assert "1" in simple_graph.nodes
    assert "2" in simple_graph.nodes
    assert "3" in simple_graph.nodes
    assert "4" in simple_graph.nodes

    # Check neighbors
    node1 = simple_graph.nodes["1"]
    assert "2" in node1.neighbors
    assert "3" in node1.neighbors

    # Check distances for neighbors
    assert node1.neighbors["2"] == pytest.approx(1.0, rel=1e-2)
    assert node1.neighbors["3"] == pytest.approx(1.414, rel=1e-2)


# Test for adding nodes and edges to the graph
def test_add_node_and_edge():
    g = Graph()

    node1 = Node(node_id="1", x_svg=0, y_svg=0, floor_number=1, poi_type="type1")
    node2 = Node(node_id="2", x_svg=1, y_svg=0, floor_number=1, poi_type="type2")

    g.add_node(node1)
    g.add_node(node2)

    # Test that nodes are added
    assert "1" in g.nodes
    assert "2" in g.nodes

    g.add_edge("1", "2")

    # Test that edge is added
    assert "2" in node1.neighbors
    assert node1.neighbors["2"] == pytest.approx(1.0, rel=1e-2)  # distance between (0, 0) and (1, 0)


# Test for invalid node
def test_invalid_node():
    g = Graph()

    node1 = Node(node_id="1", x_svg=0, y_svg=0, floor_number=1, poi_type="type1")
    g.add_node(node1)

    # Test an invalid path (start or end node doesn't exist)
    result = g.find_shortest_path("1", "2")
    assert result is None
