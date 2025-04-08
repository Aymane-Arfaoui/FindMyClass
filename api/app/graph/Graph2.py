import networkx as nx
import json
import os
from typing import Dict, Any, List

class Graph:
    def __init__(self, scale_factor=0.05):
        self.graph_var = nx.Graph()
        self.scale_factor = scale_factor

    def get_node_by_id(self, node_id: str) -> Dict[str, Any]:
        return self.graph_var.nodes[node_id]
    def add_node(self, node_data: Dict[str, Any]):
        node_id = node_data["id"]
        self.graph_var.add_node(node_id, **node_data)

    def get_neighbors(self, node_id: str) -> List[str]:
        return list(self.graph_var.neighbors(node_id))

    def add_edge(self, node1_id: str, node2_id: str):
        # Calculate weight as Euclidean distance scaled by scale_factor
        node1 = self.graph_var.nodes[node1_id]
        node2 = self.graph_var.nodes[node2_id]
        weight = self._calculate_weight(node1, node2)
        distance = self._calculate_distance(node1, node2)
        self.graph_var.add_edge(node1_id, node2_id, weight=weight, distance=distance)

    def _calculate_weight(self, node1: Dict[str, Any], node2: Dict[str, Any]) -> float:
        if(node1["poi_type"] == "elevator" and node2["poi_type"] == "elevator"):#if both are elevators
            return 15
        elif(node1["poi_type"] == "escalator" and node2["poi_type"] == "escalator"):
            return 15
        elif(node1["poi_type"] == "stairs" and node2["poi_type"] == "stairs"):
            return 20
        else:
            dx = (node1["x"] - node2["x"]) * self.scale_factor
            dy = (node1["y"] - node2["y"]) * self.scale_factor
            return (dx**2 + dy**2)**0.5

    def _calculate_distance(self, node1: Dict[str, Any], node2: Dict[str, Any]) -> float:
        if(node1["poi_type"] == "elevator" and node2["poi_type"] == "elevator"):#if both are elevators
            return 0
        elif(node1["poi_type"] == "escalator" and node2["poi_type"] == "escalator"):
            return 5
        elif(node1["poi_type"] == "stairs" and node2["poi_type"] == "stairs"):
            return 10
        else:
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
                    # Check if both nodes exist before adding the edge
                    if edge_pair[0] in self.graph_var.nodes and edge_pair[1] in self.graph_var.nodes:
                        self.add_edge(edge_pair[0], edge_pair[1])
                    else:
                        missing_nodes = []
                        if edge_pair[0] not in self.graph_var.nodes:
                            missing_nodes.append(edge_pair[0])
                        if edge_pair[1] not in self.graph_var.nodes:
                            missing_nodes.append(edge_pair[1])
                        print(f"Warning: Skipping edge in {file_path} - nodes not found: {', '.join(missing_nodes)}")

    def load_from_json_folder(self, folder_path: str):
        """Load only nodes from all JSON files in the folder"""
        if not os.path.exists(folder_path):
            raise FileNotFoundError(f"Folder not found: {folder_path}")

        json_files = self._collect_json_files(folder_path)
        
        # Load all nodes from all files
        for file_path in json_files:
            self._load_nodes_from_file(file_path)

    def load_edges_from_json_folder(self, folder_path: str):
        """Load only edges from all JSON files in the folder"""
        if not os.path.exists(folder_path):
            raise FileNotFoundError(f"Folder not found: {folder_path}")

        json_files = self._collect_json_files(folder_path)
        
        # Load all edges from all files
        for file_path in json_files:
            try:
                self._load_edges_from_file(file_path)
            except KeyError as e:
                print(f"Warning: Node not found while loading edges from {file_path}: {str(e)}")
                continue

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
