from typing import Dict, List, Optional, Annotated, Any
import enum
import logging
from pathlib import Path
import os
from .graph.Graph2 import Graph

logger = logging.getLogger("navigation")
logger.setLevel(logging.INFO)

class NavigationDetails(enum.Enum):
    START_ID = "start_id"
    END_ID = "end_id"
    CAMPUS = "campus"
    ACCESSIBILITY = "accessibility"
    PATH = "path"
    DISTANCE = "distance"

class AINavigationAPI:
    def __init__(self):
        self.graphs = {}
        self.accessibility_graphs = {}
        self._navigation_details = {
            NavigationDetails.START_ID: "",
            NavigationDetails.END_ID: "",
            NavigationDetails.CAMPUS: "hall",
            NavigationDetails.ACCESSIBILITY: False,
            NavigationDetails.PATH: [],
            NavigationDetails.DISTANCE: 0.0
        }
        self._initialize_graphs()

    def _initialize_graphs(self):
        """Initialize graphs for all campuses"""
        current_dir = Path(os.getcwd())
        if 'api' not in current_dir.parts:
            current_dir = current_dir / 'api'
        
        base_path = current_dir / 'app/data/campus_jsons'
        for campus in ['hall', 'mb', 'cc']:
            campus_path = base_path / campus
            if campus_path.exists():
                self.graphs[campus] = Graph()
                self.graphs[campus].load_from_json_folder(str(campus_path))

    def get_path_details(self) -> str:
        """Get current navigation details in human-readable format"""
        details = self._navigation_details
        if not details[NavigationDetails.PATH]:
            return "No path currently set"
        
        path_str = "Navigation Details:\n"
        path_str += f"From: {self._format_room_id(details[NavigationDetails.START_ID])}\n"
        path_str += f"To: {self._format_room_id(details[NavigationDetails.END_ID])}\n"
        path_str += f"Campus: {details[NavigationDetails.CAMPUS]}\n"
        path_str += f"Accessibility Mode: {'Yes' if details[NavigationDetails.ACCESSIBILITY] else 'No'}\n"
        path_str += f"Distance: {details[NavigationDetails.DISTANCE]:.1f} meters\n"
        path_str += "Path: " + " → ".join([self._format_room_id(node) for node in details[NavigationDetails.PATH]])
        return path_str

    def _format_room_id(self, room_id: str) -> str:
        """Convert system room ID to human-readable format"""
        if not room_id:
            return ""
        
        # Handle special nodes like elevators, stairs, etc.
        if "elevator" in room_id.lower():
            return "Elevator"
        elif "stairs" in room_id.lower():
            return "Stairs"
        elif "escalator" in room_id.lower():
            return "Escalator"
        
        # Handle room numbers (e.g., "h-102_7" to "H-102 (Floor 7)")
        parts = room_id.split("_")
        if len(parts) == 2:
            room, floor = parts
            room = room.upper()
            return f"{room} (Floor {floor})"
        return room_id.upper()

    def _normalize_room_id(self, room_description: str) -> str:
        """Convert user-friendly room description to system ID format"""
        # Remove spaces and convert to lowercase
        room = room_description.lower().replace(" ", "")
        
        # Extract building, room number and floor
        import re
        match = re.match(r"([a-z]+)-?(\d+)(?:_(\d+))?", room)
        if match:
            building, room_num, floor = match.groups()
            floor = floor if floor else "1"  # Default to floor 1 if not specified
            return f"{building}-{room_num}_{floor}"
        return room

    def find_shortest_path(self, start_room: str, end_room: str, campus: str = 'hall', accessibility: bool = False) -> dict:
        """Find the shortest path between two rooms"""
        if campus not in self.graphs:
            return {"error": f"Campus {campus} not found"}
        
        graph = self.graphs[campus]
        if accessibility:
            if campus not in self.accessibility_graphs:
                self.accessibility_graphs[campus] = Graph()
                self.accessibility_graphs[campus].graph = self._get_sub_graph(graph)
            graph = self.accessibility_graphs[campus]
        
        try:
            path_info = graph.find_shortest_path(start_room, end_room)
            if not path_info:
                return {"error": "No path found between the specified rooms"}
            
            # Store navigation details
            self._navigation_details = {
                NavigationDetails.START_ID: start_room,
                NavigationDetails.END_ID: end_room,
                NavigationDetails.CAMPUS: campus,
                NavigationDetails.ACCESSIBILITY: accessibility,
                NavigationDetails.PATH: path_info["path"],
                NavigationDetails.DISTANCE: path_info["distance"]
            }
            
            return path_info
        except Exception as e:
            return {"error": str(e)}

    def _get_sub_graph(self, graph):
        """Create a subgraph excluding stairs and escalators for accessibility"""
        import networkx as nx
        allowed_edges = set(graph.graph.edges())
        
        for edge in graph.graph.edges():
            if any(x in edge[0] or x in edge[1] for x in ['escalator', 'stairs']):
                allowed_edges.remove(edge)
        
        return graph.graph.edge_subgraph(allowed_edges).copy()

    def find_multiple_destinations(self, start_room: str, destinations: List[str], campus: str = "hall") -> Dict:
        """Find path through multiple destinations"""
        logger.info(f"Finding path from {start_room} through destinations: {destinations}")
        
        try:
            # Get paths
            result = self.graphs[campus].find_paths_to_multiple_destinations(start_room, destinations)
            if not result["paths"]:
                return {"error": "No valid paths found"}
            
            return result
            
        except Exception as e:
            logger.error(f"Error finding multiple destinations path: {str(e)}")
            return {"error": f"Error finding path: {str(e)}"}

    def has_active_navigation(self) -> bool:
        """Check if there's an active navigation path"""
        return bool(self._navigation_details[NavigationDetails.PATH]) 