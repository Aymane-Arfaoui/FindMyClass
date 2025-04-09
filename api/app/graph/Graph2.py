import networkx as nx
import json
import os
from typing import Dict, Any, List

class Graph:
    def __init__(self, scale_factor=0.005):  # 1 pixel ≈ 0.005 meters (0.5cm)
        self.graph_var = nx.Graph()
        self.scale_factor = scale_factor
        # Real-world constants in meters
        self.ELEVATOR_TIME = 3  # 3 meters equivalent for elevator time between floors
        self.ESCALATOR_DISTANCE = 5  # 5 meters for escalator between floors
        self.STAIRS_DISTANCE = 8  # 8 meters for stairs between floors

    def add_node(self, node_data: Dict[str, Any]):
        node_id = node_data["id"]
        self.graph_var.add_node(node_id, **node_data)

    def get_neighbors(self, node_id: str) -> List[str]:
        return list(self.graph_var.neighbors(node_id))

    def add_edge(self, node1_id: str, node2_id: str):
        node1 = self.graph_var.nodes[node1_id]
        node2 = self.graph_var.nodes[node2_id]
        weight = self._calculate_weight(node1, node2)
        distance = self._calculate_distance(node1, node2)
        self.graph_var.add_edge(node1_id, node2_id, weight=weight, distance=distance)

    def _calculate_weight(self, node1: Dict[str, Any], node2: Dict[str, Any]) -> float:
        # Weight affects path finding - prefer easier paths
        if(node1["poi_type"] == "elevator" and node2["poi_type"] == "elevator"):
            return self.ELEVATOR_TIME  # Prefer elevators for accessibility
        elif(node1["poi_type"] == "escalator" and node2["poi_type"] == "escalator"):
            return self.ESCALATOR_DISTANCE * 1.2  # Slightly higher weight than walking
        elif(node1["poi_type"] == "stairs" and node2["poi_type"] == "stairs"):
            return self.STAIRS_DISTANCE * 1.5  # Higher weight to prefer elevators/escalators
        else:
            # Regular walking distance
            dx = (node1["x"] - node2["x"]) * self.scale_factor
            dy = (node1["y"] - node2["y"]) * self.scale_factor
            return (dx**2 + dy**2)**0.5

    def _calculate_distance(self, node1: Dict[str, Any], node2: Dict[str, Any]) -> float:
        # Distance is actual meters traveled
        if(node1["poi_type"] == "elevator" and node2["poi_type"] == "elevator"):
            return self.ELEVATOR_TIME  # Time in equivalent meters
        elif(node1["poi_type"] == "escalator" and node2["poi_type"] == "escalator"):
            return self.ESCALATOR_DISTANCE
        elif(node1["poi_type"] == "stairs" and node2["poi_type"] == "stairs"):
            return self.STAIRS_DISTANCE
        else:
            # Regular walking distance
            dx = (node1["x"] - node2["x"]) * self.scale_factor
            dy = (node1["y"] - node2["y"]) * self.scale_factor
            return (dx**2 + dy**2)**0.5

    def _collect_json_files(self, folder_path: str) -> list:
        """Recursively collect all .json files in the folder"""
        json_files = []
        for root, _, files in os.walk(folder_path):
            for file in files:
                if file.endswith('.json'):
                    json_files.append(os.path.join(root, file))
        return json_files

    def _load_nodes_from_file(self, file_path: str):
        """Load and add nodes from a single JSON file"""
        with open(file_path) as f:
            data = json.load(f)
            for node_data in data.get("nodes", []):
                self.add_node(node_data)

    def _load_edges_from_file(self, file_path: str):
        """Load and add edges from a single JSON file"""
        with open(file_path) as f:
            data = json.load(f)
            for edge_pair in data.get("edges", []):
                if len(edge_pair) == 2:
                    self.add_edge(edge_pair[0], edge_pair[1])

    def load_from_json_folder(self, folder_path: str):
        if not os.path.exists(folder_path):
            raise FileNotFoundError(f"Folder not found: {folder_path}")

        json_files = self._collect_json_files(folder_path)

        for file_path in json_files:
            self._load_nodes_from_file(file_path)

        for file_path in json_files:
            self._load_edges_from_file(file_path)

    def find_shortest_path(self, start_id: str, end_id: str) -> Dict[str, Any]:
        try:
            shortest_path = nx.dijkstra_path(self.graph_var, start_id, end_id, weight='weight')
            distance = nx.path_weight(self.graph_var,shortest_path,weight='distance')
            return {
                "path": shortest_path,
                "distance": distance
            }
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None

    def yen_k_shortest_paths(self, start_id: str, end_id: str, num=3) -> List[Dict[str, Any]]:
        from networkx.algorithms.simple_paths import shortest_simple_paths
        paths = []
        try:
            generator = shortest_simple_paths(self.graph_var, start_id, end_id, weight='weight')
            for _, path in zip(range(num), generator):
                distance = sum(
                    self.graph_var[u][v]['weight'] for u, v in zip(path[:-1], path[1:])
                )
                paths.append({
                    "path": path,
                    "distance": distance
                })
            return paths
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return []

    def find_paths_to_multiple_destinations(self, start_id: str, destination_ids: List[str]) -> Dict[str, Any]:
        """
        Find shortest paths sequentially through multiple destinations in the specified order.
        Returns paths and distances for each segment, plus total distance.
        """
        paths_info = []
        total_distance = 0
        current_position = start_id

        for dest_id in destination_ids:
            try:
                # Find path from current position to next destination
                path = nx.dijkstra_path(self.graph_var, current_position, dest_id, weight='weight')
                distance = nx.path_weight(self.graph_var, path, weight='distance')
                
                paths_info.append({
                    "destination": dest_id,
                    "path": path,
                    "distance": distance
                })
                
                total_distance += distance
                current_position = dest_id  # Update current position for next destination
                
            except (nx.NetworkXNoPath, nx.NodeNotFound):
                paths_info.append({
                    "destination": dest_id,
                    "error": "No path found or invalid destination"
                })

        return {
            "paths": paths_info,
            "total_distance": total_distance
        }
