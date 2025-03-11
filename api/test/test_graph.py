import pytest
from Graph2 import Graph  # Replace with the actual module name

@pytest.fixture
def graph():
    """Fixture to create a Graph instance before each test"""
    g = Graph(scale_factor=0.1)

    # Add nodes and edges manually for testing
    g.add_node({"id": "A", "x": 0, "y": 0})
    g.add_node({"id": "B", "x": 1, "y": 1})
    g.add_node({"id": "C", "x": 2, "y": 2})
    g.add_edge("A", "B")
    g.add_edge("B", "C")

    return g

def test_add_node(graph):
    """Test that nodes are added correctly"""
    assert "A" in graph.graph.nodes
    assert "B" in graph.graph.nodes
    assert "C" in graph.graph.nodes

def test_add_edge(graph):
    """Test that edges are added correctly with the correct weight"""
    assert ("A", "B") in graph.graph.edges
    assert ("B", "C") in graph.graph.edges

    # Verify the weight (Euclidean distance)
    weight_ab = graph.graph["A"]["B"]["weight"]
    weight_bc = graph.graph["B"]["C"]["weight"]
    assert abs(weight_ab - 0.14142135623730953) < 1e-9  # Expected based on scale_factor 0.1
    assert abs(weight_bc - 0.14142135623730953) < 1e-9  # Expected based on scale_factor 0.1

def test_find_shortest_path(graph):
    """Test that the shortest path between nodes is found correctly"""
    result = graph.find_shortest_path("A", "C")
    assert result is not None
    assert result["path"] == ["A", "B", "C"]
    assert abs(result["distance"] - 0.28284271247461906) < 1e-9  # Distance from A to C

def test_yen_k_shortest_paths(graph):
    """Test the K-shortest paths algorithm"""
    k_paths = graph.yen_k_shortest_paths("A", "C", K=2)
    assert len(k_paths) == 1

    # Check that the paths are correctly returned
    assert "path" in k_paths[0]
    assert "distance" in k_paths[0]