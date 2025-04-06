import pytest
from unittest.mock import MagicMock, patch
from api.app.aiapi import AINavigationAPI, NavigationDetails


@patch("api.app.aiapi.Graph")  # Patches Graph in aiapi.py
class TestAINavigationAPI:

    def test_initialize_graphs_sets_up_graphs(self, mock_graph_class):
        mock_instance = MagicMock()
        mock_graph_class.return_value = mock_instance

        api = AINavigationAPI()

        # Check that some graphs were created
        assert any(campus in api.graphs for campus in ['hall', 'mb', 'cc'])

    def test_get_path_details_when_empty(self, mock_graph_class):
        api = AINavigationAPI()
        result = api.get_path_details()
        assert result == "No path currently set"

    def test_get_path_details_with_data(self, mock_graph_class):
        api = AINavigationAPI()
        api._navigation_details[NavigationDetails.PATH] = ["h-102_1", "h-110_1"]
        api._navigation_details[NavigationDetails.START_ID] = "h-102_1"
        api._navigation_details[NavigationDetails.END_ID] = "h-110_1"
        api._navigation_details[NavigationDetails.DISTANCE] = 42.0

        result = api.get_path_details()
        assert "Navigation Details" in result
        assert "From: H-102 (Floor 1)" in result
        assert "To: H-110 (Floor 1)" in result
        assert "Distance: 42.0 meters" in result

    def test_format_room_id_variants(self, mock_graph_class):
        api = AINavigationAPI()
        assert api._format_room_id("elevator_up") == "Elevator"
        assert api._format_room_id("stairs_down") == "Stairs"
        assert api._format_room_id("escalator1") == "Escalator"
        assert api._format_room_id("h-101_3") == "H-101 (Floor 3)"
        assert api._format_room_id("h110") == "H110"

    def test_normalize_room_id_patterns(self, mock_graph_class):
        api = AINavigationAPI()
        assert api._normalize_room_id("H-110") == "h-110_1"
        assert api._normalize_room_id("H-110_2") == "h-110_2"
        assert api._normalize_room_id("randomtext") == "randomtext"

    def test_find_shortest_path_success(self, mock_graph_class):
        mock_graph = MagicMock()
        mock_graph.find_shortest_path.return_value = {
            "path": ["a", "b", "c"],
            "distance": 99.9
        }
        mock_graph_class.return_value = mock_graph

        api = AINavigationAPI()
        api.graphs["hall"] = mock_graph

        result = api.find_shortest_path("a", "c", "hall")
        assert result["path"] == ["a", "b", "c"]
        assert result["distance"] == 99.9
        assert api.has_active_navigation()

    def test_find_shortest_path_no_graph(self, mock_graph_class):
        api = AINavigationAPI()
        result = api.find_shortest_path("a", "b", "unknown")
        assert "error" in result
        assert "Campus unknown not found" in result["error"]

    def test_find_shortest_path_not_found(self, mock_graph_class):
        mock_graph = MagicMock()
        mock_graph.find_shortest_path.return_value = None
        mock_graph_class.return_value = mock_graph

        api = AINavigationAPI()
        api.graphs["hall"] = mock_graph

        result = api.find_shortest_path("a", "b", "hall")
        assert result["error"] == "No path found between the specified rooms"

    def test_find_multiple_destinations_success(self, mock_graph_class):
        mock_graph = MagicMock()
        mock_graph.find_paths_to_multiple_destinations.return_value = {
            "paths": [["a", "b", "c"]]
        }
        mock_graph_class.return_value = mock_graph

        api = AINavigationAPI()
        api.graphs["hall"] = mock_graph

        result = api.find_multiple_destinations("a", ["b", "c"])
        assert "paths" in result

    def test_find_multiple_destinations_error(self, mock_graph_class):
        mock_graph = MagicMock()
        mock_graph.find_paths_to_multiple_destinations.side_effect = Exception("Simulated failure")
        mock_graph_class.return_value = mock_graph

        api = AINavigationAPI()
        api.graphs["hall"] = mock_graph

        result = api.find_multiple_destinations("a", ["b"])
        assert "error" in result
        assert "Simulated failure" in result["error"]

    def test_normalize_room_id_invalid_format(self, mock_graph_class):
        api = AINavigationAPI()
        result = api._normalize_room_id("this_is_not_a_room")
        assert result == "this_is_not_a_room"  # falls back to input

    def test_get_sub_graph_removes_stairs_escalators(self, mock_graph_class):
        import networkx as nx

        api = AINavigationAPI()

        # Create a dummy graph with stairs/escalator edges
        G = nx.DiGraph()
        G.add_edges_from([
            ("a", "b"),
            ("b", "stairs_up"),
            ("stairs_up", "c"),
            ("c", "escalator_down"),
            ("escalator_down", "d")
        ])

        graph_mock = MagicMock()
        graph_mock.graph = G

        sub_graph = api._get_sub_graph(graph_mock)

        # Check that the stair/escalator edges are removed
        assert ("b", "stairs_up") not in sub_graph.edges
        assert ("c", "escalator_down") not in sub_graph.edges
        assert ("a", "b") in sub_graph.edges  # valid edge remains

    def test_find_shortest_path_accessibility_enabled(self, mock_graph_class):
        # Simulate a campus and accessibility logic path
        path_data = {"path": ["x", "y", "z"], "distance": 123.4}

        # Mock Graph and its graph structure
        graph_mock = MagicMock()
        graph_mock.find_shortest_path.return_value = path_data
        graph_mock.graph.edges.return_value = [("x", "stairs_y"), ("y", "z")]

        mock_graph_class.return_value = graph_mock

        api = AINavigationAPI()
        api.graphs["hall"] = graph_mock

        # Call with accessibility=True
        result = api.find_shortest_path("x", "z", campus="hall", accessibility=True)

        assert result["path"] == ["x", "y", "z"]
        assert api._navigation_details[NavigationDetails.ACCESSIBILITY] is True

