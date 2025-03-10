import networkx as nx
import json
import os
from typing import Dict, Any, List

class Graph:
    def __init__(self, scale_factor=0.05):
        self.graph = nx.Graph()
        self.scale_factor = scale_factor

    def add_node(self, node_data: Dict[str, Any]):
        node_id = node_data["id"]
        self.graph.add_node(node_id, **node_data)

    def add_edge(self, node1_id: str, node2_id: str):
        # Calculate weight as Euclidean distance scaled by scale_factor
        node1 = self.graph.nodes[node1_id]
        node2 = self.graph.nodes[node2_id]
        weight = self._calculate_distance(node1, node2)
        self.graph.add_edge(node1_id, node2_id, weight=weight)

    def _calculate_distance(self, node1: Dict[str, Any], node2: Dict[str, Any]) -> float:
        dx = (node1["x"] - node2["x"]) * self.scale_factor
        dy = (node1["y"] - node2["y"]) * self.scale_factor
        return (dx**2 + dy**2)**0.5

    def load_from_json_folder(self, folder_path: str):
        for root, _, files in os.walk(folder_path):
            for file in files:
                if file.endswith('.json'):
                    full_path = os.path.join(root, file)
                    with open(full_path) as f:
                        data = json.load(f)
                        # Add nodes
                        for node_data in data["nodes"]:
                            self.add_node(node_data)
                        # Add edges
                        for edge_pair in data["edges"]:
                            if len(edge_pair) == 2:
                                self.add_edge(edge_pair[0], edge_pair[1])

    def find_shortest_path(self, start_id: str, end_id: str) -> Dict[str, Any]:
        try:
            shortest_path = nx.dijkstra_path(self.graph, start_id, end_id, weight='weight')
            distance = nx.dijkstra_path_length(self.graph, start_id, end_id, weight='weight')
            return {
                "path": shortest_path,
                "distance": distance
            }
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None

    def yen_k_shortest_paths(self, start_id: str, end_id: str, K=3) -> List[Dict[str, Any]]:
        from networkx.algorithms.simple_paths import shortest_simple_paths
        paths = []
        try:
            generator = shortest_simple_paths(self.graph, start_id, end_id, weight='weight')
            for _, path in zip(range(K), generator):
                distance = sum(
                    self.graph[u][v]['weight'] for u, v in zip(path[:-1], path[1:])
                )
                paths.append({
                    "path": path,
                    "distance": distance
                })
            return paths
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return []
