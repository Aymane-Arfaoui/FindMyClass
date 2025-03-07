# This file is used to route the user through the indoor map
# this file implement algroithm for shortest path and graph implementation

import networkx as nx
from typing import List, Tuple, Dict
import json
import os

class IndoorRouter:
    def __init__(self):

        self.graph = nx.Graph()

        # define entrances and stuff:
        self.entrances = ['103','101']

        #let us load coordinates from json file 
        current_dir = os.path.dirname(os.path.abspath(__file__))
        coordinates_path = os.path.join(current_dir, 'Services/coordinates.json')

        with open(coordinates_path, 'r') as file:
            self.nodes = json.load(file)

        #now let us define the connections between nodes
        self.edges = [
            ('103', 'hallway'),
            ('hallway', '101'),

            # Connect rooms to the hallway
            ('hallway', '110'), 
            ('hallway', '115'),  
            ('hallway', '118'), 

            ('110', '115'),    
            ('115', '118'),   
            ('103', '101'), 

        ]
        self._build_graph()
        print("graph successfully built")
        print(f'number of nodes: {self.graph.number_of_nodes()}')
        print(f"Number of edges: {self.graph.number_of_edges()}")
    
    def _build_graph(self):
        for node, pos in self.nodes.items():
            self.graph.add_node(node, pos=pos)

            print(f"Node {node} added with position {pos}")
            #addking here the edges with weights which are arhe distance s
            for n1,n2 in self.edges:
                if n1 in self.nodes and n2 in self.nodes:
                    weight = self._calculate_distance(self.nodes[n1], self.nodes[n2])
                    self.graph.add_edge(n1, n2, weight=weight)
                    print(f"Edge {n1} <-> {n2} added with weight {weight}")
    #calculate the distance between two nodes
    def _calculate_distance(self, pos1: List[int], pos2: List[int]) -> float:
        """Calculate Euclidean distance between two points"""
        return ((pos1[0] - pos2[0]) ** 2 + (pos1[1] - pos2[1]) ** 2) ** 0.5
    
    #find the shortest path (djikstra)
    def _find_shortest_path(self, start: str, destination: str) -> List[str]:
        if start not in self.nodes or destination not in self.nodes:
            return {"error": "Start or end node not found in the graph"}
        try:
            #djikstra algorithm
            path = nx.shortest_path(
                self.graph,
                source = start, 
                target = destination,
                weight='weight')
            
            path_coordinates = [self.nodes[node] for node in path]

            total_distance = nx.shortest_path_length(
                self.graph,
                source = start,
                target = destination,
                weight='weight'
            )
            return {"path": path, 
                    "coordinates": path_coordinates,
                    "distance":round(total_distance, 2)}
        except nx.NetworkXNoPath:
            return {"error": "No path found between start and destination"}
        
if __name__ == "__main__":
    router = IndoorRouter()
    
    # Test finding a path from 101 to 110
    result = router._find_shortest_path('101', '110')
    
    print("\nTesting path finding:")
    if "error" in result:
        print(f"Error: {result['error']}")
    else:
        print(f"Path from 101 to 110:")
        print(f"Route: {' -> '.join(result['path'])}")
        print(f"Distance: {result['distance']}")
        print(f"Coordinates: {result['coordinates']}")




