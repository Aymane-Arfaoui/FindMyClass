import json
import heapq
import copy
from typing import List, Optional



# Node class with neighbors and distance calculation
class Node:
    def __init__(self, node_id, x_svg, y_svg, scale_factor=1):
        self.id = node_id
        self.x_svg = x_svg
        self.y_svg = y_svg
        self.scale_factor = scale_factor
        self.neighbors = {}  # neighbor_id: distance

    def distance_to(self, other_node):
        dx = (self.x_svg - other_node.x_svg) * self.scale_factor
        dy = (self.y_svg - other_node.y_svg) * self.scale_factor
        return (dx**2 + dy**2)**0.5

    def get_scaled_position(self):
        return (self.x_svg * self.scale_factor, self.y_svg * self.scale_factor)

    def add_neighbor(self, neighbor_node):
        distance = self.distance_to(neighbor_node)
        self.neighbors[neighbor_node.id] = distance

    def set_scale_factor(self, scale_factor):
        self.scale_factor = scale_factor

# Graph class managing nodes and edges
class Graph:
    def __init__(self, scale_factor=1):
        self.nodes = {}
        self.scale_factor = scale_factor

    def add_node(self, node):
        node.set_scale_factor(self.scale_factor)
        self.nodes[node.id] = node

    def add_edge(self, node_id_1, node_id_2):
        node1 = self.nodes[node_id_1]
        node2 = self.nodes[node_id_2]
        node1.add_neighbor(node2)
        node2.add_neighbor(node1)

# Function to find shortest path using Dijkstra's algorithm
    def find_shortest_path(self, start_id, end_id):
        if start_id not in self.nodes or end_id not in self.nodes:
            return None  # Start or end node doesn't exist

        distances = {node_id: float('inf') for node_id in self.nodes}
        previous_nodes = {node_id: None for node_id in self.nodes}
        distances[start_id] = 0

        queue = [(0, start_id)]
        visited = set()

        while queue:
            current_distance, current_node_id = heapq.heappop(queue)

            if current_node_id in visited:
                continue
            visited.add(current_node_id)

            if current_node_id == end_id:
                break

            current_node = self.nodes[current_node_id]
            for neighbor_id, weight in current_node.neighbors.items():
                # Check if neighbor still exists (important for Yen's algorithm)
                if neighbor_id not in self.nodes:
                    continue

                distance_through_current = current_distance + weight
                if distance_through_current < distances[neighbor_id]:
                    distances[neighbor_id] = distance_through_current
                    previous_nodes[neighbor_id] = current_node_id
                    heapq.heappush(queue, (distance_through_current, neighbor_id))

        # Reconstruct path from end to start
        path = []
        node_id = end_id
        while node_id is not None:
            path.insert(0, node_id)
            node_id = previous_nodes[node_id]

        # Check if a valid path exists
        if distances[end_id] == float('inf'):
            return None  # No path found

        return {
            "path": path,
            "distance": distances[end_id]
        }


    def yen_k_shortest_paths(self, start_id, end_id, K=3):
        """
        this function allows us to find the top 3 shortest paths to the destination
        """
        
        # First, find the shortest path using Dijkstra
        first_path_result = self.find_shortest_path(self, start_id, end_id)
        if not first_path_result:
            return []  # No path found

        paths = [first_path_result]
        potential_paths = []

        for k in range(1, K):
            for i in range(len(paths[k-1]["path"]) - 1):
                spur_node_id = paths[k-1]["path"][i]
                root_path_ids = paths[k-1]["path"][:i+1]

                # Copy graph to modify temporarily
                temp_graph = copy.deepcopy(self)

                # Remove edges that are part of previous shortest paths sharing the same root path
                for path in paths:
                    if len(path["path"]) > i and path["path"][:i+1] == root_path_ids:
                        node_a = path["path"][i]
                        node_b = path["path"][i+1]
                        if node_b in temp_graph.nodes[node_a].neighbors:
                            del temp_graph.nodes[node_a].neighbors[node_b]
                        if node_a in temp_graph.nodes[node_b].neighbors:
                            del temp_graph.nodes[node_b].neighbors[node_a]

                # Remove nodes in root path except spur node
                for node_id in root_path_ids[:-1]:
                    del temp_graph.nodes[node_id]

                # Find spur path from spur node to end node
                spur_path_result = self.find_shortest_path(temp_graph, spur_node_id, end_id)

                if spur_path_result and spur_path_result["path"]:
                    total_path_ids = root_path_ids[:-1] + spur_path_result["path"]
                    total_distance = self.calculate_total_distance(self, total_path_ids)
                    candidate = {"path": total_path_ids, "distance": total_distance}
                    if candidate not in potential_paths:
                        potential_paths.append(candidate)

            if not potential_paths:
                break  # No more alternative paths

            # Sort potential paths by distance and select the shortest one
            potential_paths.sort(key=lambda x: x["distance"])
            next_shortest = potential_paths.pop(0)
            paths.append(next_shortest)

        return paths

    def calculate_total_distance(self, path_ids: List[str]) -> float:
        distance = 0.0
        for i in range(len(path_ids) - 1):
            node_a = self.nodes[path_ids[i]]
            node_b = self.nodes[path_ids[i+1]]
            distance += node_a.distance_to(node_b)
        return distance

 # Load graph from JSON file


def load_graph_from_json(g: Optional[Graph], filepath, scale_factor=0.5):
    with open(filepath) as f:
        data = json.load(f)
    
    if g is None:
        g = Graph(scale_factor)

    for n in data["nodes"]:
        g.add_node(Node(n["id"], n["x"], n["y"]))

    for edge in data["edges"]:
        g.add_edge(edge[0], edge[1])
    
    return g


