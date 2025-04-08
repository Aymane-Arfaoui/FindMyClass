import os
import json
import requests
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from graph.Graph2 import Graph
from  openaiHelper.getWeather import get_weather
from openai import OpenAI
from dotenv import load_dotenv

class IntegratedRoutingService:
    def __init__(self):
        self.indoor_graphs = {}
        self.accessibility_graphs = {}
        self._initialize_graphs()
        load_dotenv("/Users/evanteboul/SOEN390/FindMyClass/.env.local")
        self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
    def _initialize_graphs(self):
        """Initialize a single giant graph for all campuses"""
        current_dir = Path(os.getcwd())
        if 'api' not in current_dir.parts:
            current_dir = current_dir / 'api'
        
        base_path = current_dir / 'app/data/campus_jsons'
        
        # Create a single graph for all campuses
        self.indoor_graph = Graph()
        
        # First pass: Load all nodes from all campuses
        for campus in ['hall', 'mb', 'cc']:
            campus_path = base_path / campus
            if campus_path.exists():
                self.indoor_graph.load_from_json_folder(str(campus_path))
        
        # Second pass: Load all edges from all campuses
        for campus in ['hall', 'mb', 'cc']:
            campus_path = base_path / campus
            if campus_path.exists():
                # Load edges for the single graph
                self.indoor_graph.load_edges_from_json_folder(str(campus_path))
        
        # Create accessibility graph as a copy of the indoor graph
        self.accessibility_graph = Graph()
        # We'll need to implement a method to copy the graph with only accessible routes
        # This is a placeholder for now
        # self.accessibility_graph = self._create_accessibility_graph(self.indoor_graph)
    
    def get_weather_for_location(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Get weather data for a location"""
        try:
            weather_data = get_weather(latitude, longitude)
            return {
                "temperature": weather_data['temperature'],
                "precipitation": weather_data['precipitation'],
                "weather_code": weather_data['weather_code'],
                "wind_speed": weather_data['wind_speed'],
                "success": True
            }
        except Exception as e:
            return {
                "error": str(e),
                "success": False
            }
    
    def _is_bad_weather(self, weather_data: Optional[Dict[str, Any]]) -> bool:
        """Check if weather conditions are bad for outdoor travel"""
        if not weather_data or not weather_data.get("success"):
            return False
            
        return (
            weather_data.get("precipitation", 0) > 1 or 
            weather_data.get("weather_code", 0) in [56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 85, 86, 95, 96] or
            weather_data.get("temperature", 20) < 0 or
            weather_data.get("wind_speed", 0) > 20
        )
    
    def _create_indoor_segment(self, path: List[str], distance: float, campus: str) -> Dict[str, Any]:
        """Create an indoor path segment"""
        return {
            "type": "indoor",
            "path": path,
            "distance": distance,
            "campus": campus
        }
    
    def _create_outdoor_segment(self, path: Dict[str, Any], distance: float, weather_adjusted: bool = False) -> Dict[str, Any]:
        """Create an outdoor path segment"""
        return {
            "type": "outdoor",
            "path": path,
            "distance": distance,
            "weather_adjusted": weather_adjusted
        }
    
    def _create_integrated_path(self, segments: List[Dict[str, Any]], total_distance: float) -> Dict[str, Any]:
        """Create an integrated path with multiple segments"""
        return {
            "segments": segments,
            "total_distance": total_distance,
            "success": True,
            "type": "integrated"
        }
    
    def find_indoor_path(self, start_id: str, end_id: str, accessibility: bool = False) -> Dict[str, Any]:
        """Find the shortest path between two indoor locations"""
        # Use the single indoor graph for all campuses
        graph_to_use = self.indoor_graph
        
        if accessibility:
            # Create accessibility graph if it doesn't exist
            if not hasattr(self, 'accessibility_graph') or self.accessibility_graph is None:
                self.accessibility_graph = Graph()
                # Create a copy of the indoor graph with only accessible routes
                self.accessibility_graph.graph = self._get_sub_graph(self.indoor_graph)
            graph_to_use = self.accessibility_graph
        
        # Check if the nodes exist in the graph
        if start_id not in graph_to_use.graph_var.nodes:
            # Try to find a similar node
            similar_nodes = [node for node in graph_to_use.graph_var.nodes if start_id.lower() in node.lower()]
            if similar_nodes:
                start_id = similar_nodes[0]  # Use the first similar node found
            else:
                return {"error": f"Start node '{start_id}' not found in graph", "success": False}
                
        if end_id not in graph_to_use.graph_var.nodes:
            # Try to find a similar node
            similar_nodes = [node for node in graph_to_use.graph_var.nodes if end_id.lower() in node.lower()]
            if similar_nodes:
                end_id = similar_nodes[0]  # Use the first similar node found
            else:
                return {"error": f"End node '{end_id}' not found in graph", "success": False}
        
        path_info = graph_to_use.find_shortest_path(start_id, end_id)
        if not path_info:
            return {"error": "No path found", "success": False}
        
        return {
            "path": path_info["path"],
            "distance": path_info["distance"],
            "success": True,
            "type": "indoor"
        }
    
    def _get_sub_graph(self, graph):
        """Get a subgraph with only accessible routes (no stairs/escalators)"""
        # Create a copy of the graph to avoid modifying the original
        nx_graph = graph.graph.copy()
        
        # Find edges to remove (those containing escalator or stairs)
        edges_to_remove = []
        for edge in nx_graph.edges():
            if "escalator" in edge[0] or "stairs" in edge[0] or "escalator" in edge[1] or "stairs" in edge[1]:
                edges_to_remove.append(edge)
        
        # Remove the edges
        for edge in edges_to_remove:
            nx_graph.remove_edge(edge[0], edge[1])
        
        return nx_graph
    
    def find_outdoor_path(self, origin: str, destination: str, mode: str = "walking", weather_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Find the shortest path between two outdoor locations using Google Maps API"""
        try:
            import requests
            import polyline
            GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
            
            # Adjust mode based on weather conditions
            # if self._is_bad_weather(weather_data) and mode == "walking":
            #     mode = "transit"
            
            # Check if we have a valid API key
            if not GOOGLE_MAPS_API_KEY or GOOGLE_MAPS_API_KEY == "YOUR_API_KEY":
                return {"error": "No API key found", "success": False}
                # Return a mock path for testing
                # return self._create_mock_outdoor_path(origin, destination)
            
            response = requests.get(
                "https://maps.googleapis.com/maps/api/directions/json",
                params={
                    "origin": origin,
                    "destination": destination,
                    "mode": mode,
                    "alternatives": True,
                    "key": GOOGLE_MAPS_API_KEY
                }
            )
            
            if response.status_code != 200:
                # Return a mock path if the API call fails
                # return self._create_mock_outdoor_path(origin, destination)
                return {"error": "Failed to get directions", "success": False}
            
            data = response.json()
            if data["status"] != "OK":
                return {"error": f"Google Maps API error: {data.get('error_message', 'Unknown error')}", "success": False}
            
            routes = []
            for route in data["routes"]:
                encoded = route["overview_polyline"]["points"]
                decoded_coords = polyline.decode(encoded)
                coordinates = [[lng, lat] for lat, lng in decoded_coords]
                
                steps = []
                for leg in route["legs"]:
                    for step in leg["steps"]:
                        steps.append({
                            "instruction": step["html_instructions"].replace("<b>", "").replace("</b>", ""),
                            "distance": step["distance"]["text"],
                            "duration": step["duration"]["text"]
                        })
                
                routes.append({
                    "mode": mode,
                    "distance": route["legs"][0]["distance"]["text"],
                    "duration": route["legs"][0]["duration"]["text"],
                    "steps": steps,
                    "coordinates": coordinates
                })
            
            return {
                "routes": routes,
                "success": True,
                "type": "outdoor"
            }
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def find_integrated_path(self, start_location: Dict[str, Any], end_location: Dict[str, Any], 
                            weather_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Find an integrated path that may include both indoor and outdoor segments
        
        Args:
            start_location: Dict with keys 'id', 'type' ('indoor' or 'outdoor'), 'lat', 'lng' (for outdoor)
            end_location: Same structure as start_location
            weather_data: Optional weather data to consider in route planning
        """
        # If both locations are indoor, use indoor routing
        if start_location["type"] == "indoor" and end_location["type"] == "indoor":
            # Try to find a direct path first
            direct_path = self.find_indoor_path(start_location["id"], end_location["id"])
            if direct_path["success"]:
                return direct_path
            
            # If direct path fails, try to find a path through exits
            return self._find_cross_building_path(start_location, end_location, weather_data)
        
        # If both locations are outdoor, use outdoor routing
        elif start_location["type"] == "outdoor" and end_location["type"] == "outdoor":
            return self.find_outdoor_path(
                f"{start_location['lat']},{start_location['lng']}", 
                f"{end_location['lat']},{end_location['lng']}",
                weather_data=weather_data
            )
        
        # Mixed indoor/outdoor routing
        else:
            return self._find_mixed_path(start_location, end_location, weather_data)
    
    def _find_cross_building_path(self, start_location: Dict[str, Any], end_location: Dict[str, Any], 
                                 weather_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Find a path between two buildings, which may involve going outside"""
        # Check if weather conditions suggest using indoor routes
        is_bad_weather = self._is_bad_weather(weather_data)
        
        # Try to find a path through the tunnel between Hall and JMSB
        if "h1" in start_location["id"] and "mb" in end_location["id"]:
            # From Hall to JMSB
            # Indoor path from start to tunnel in Hall
            indoor_start_path = self.find_indoor_path(start_location["id"], "h1_tunnel_entrance")
            if not indoor_start_path["success"]:
                # Try alternative path if the specific tunnel entrance isn't found
                indoor_start_path = self.find_indoor_path(start_location["id"], "h1_exit_main")
                if not indoor_start_path["success"]:
                    return {"error": "Failed to find path to exit in Hall", "success": False}
            
            # Indoor path from metro entrance in JMSB S2 to end
            indoor_end_path = self.find_indoor_path("mb_s2_metro_entrance", end_location["id"])
            if not indoor_end_path["success"]:
                # Try alternative path if the specific metro entrance isn't found
                indoor_end_path = self.find_indoor_path("mb1_entrance_main", end_location["id"])
                if not indoor_end_path["success"]:
                    return {"error": "Failed to find path from entrance in JMSB", "success": False}
            
            # Create path segments
            segments = [
                self._create_indoor_segment(
                    indoor_start_path["path"],
                    indoor_start_path["distance"],
                    "hall"
                ),
                self._create_indoor_segment(
                    ["h1_tunnel_entrance", "mb_s2_metro_entrance"],  # Tunnel path
                    50.0,  # Approximate distance through tunnel
                    "tunnel"
                ),
                self._create_indoor_segment(
                    indoor_end_path["path"],
                    indoor_end_path["distance"],
                    "mb"
                )
            ]
            
            total_distance = indoor_start_path["distance"] + 50.0 + indoor_end_path["distance"]
            return self._create_integrated_path(segments, total_distance)
        elif "mb" in start_location["id"] and "h1" in end_location["id"]:
            # From JMSB to Hall
            # Indoor path from start to metro entrance in JMSB S2
            indoor_start_path = self.find_indoor_path(start_location["id"], "mb_s2_metro_entrance")
            if not indoor_start_path["success"]:
                # Try alternative path if the specific metro entrance isn't found
                indoor_start_path = self.find_indoor_path(start_location["id"], "mb1_exit_main")
                if not indoor_start_path["success"]:
                    return {"error": "Failed to find path to exit in JMSB", "success": False}
            
            # Indoor path from tunnel in Hall to end
            indoor_end_path = self.find_indoor_path("h1_tunnel_entrance", end_location["id"])
            if not indoor_end_path["success"]:
                # Try alternative path if the specific tunnel entrance isn't found
                indoor_end_path = self.find_indoor_path("h1_entrance_main", end_location["id"])
                if not indoor_end_path["success"]:
                    return {"error": "Failed to find path from entrance in Hall", "success": False}
            
            # Create path segments
            segments = [
                self._create_indoor_segment(
                    indoor_start_path["path"],
                    indoor_start_path["distance"],
                    "mb"
                ),
                self._create_indoor_segment(
                    ["mb_s2_metro_entrance", "h1_tunnel_entrance"],  # Tunnel path
                    50.0,  # Approximate distance through tunnel
                    "tunnel"
                ),
                self._create_indoor_segment(
                    indoor_end_path["path"],
                    indoor_end_path["distance"],
                    "hall"
                )
            ]
            
            total_distance = indoor_start_path["distance"] + 50.0 + indoor_end_path["distance"]
            return self._create_integrated_path(segments, total_distance)
        elif start_location["id"].startswith("h") and "cc" in end_location["id"]:
            # From Hall to CC - requires going outdoors
            # Indoor path from start to exit in Hall
            indoor_start_path = self.find_indoor_path(start_location["id"], "h1_entrance")
            if not indoor_start_path["success"]:
                # Try alternative exit if the main entrance isn't found
                return {"error": "Failed to find path to exit in Hall", "success": False}
                    
            
            # Indoor path from entrance in CC to end
            indoor_end_path = self.find_indoor_path("cc_entrance_main", end_location["id"])
            if not indoor_end_path["success"]:
                return {"error": "Failed to find path from entrance in CC", "success": False}
            
            # Get the coordinates for Hall exit and CC entrance
            hall_exits = self._get_building_exits('hall')
            cc_entrances = self._get_building_entrances('cc')
            
            if not hall_exits or not cc_entrances:
                return {"error": "Missing building exit/entrance coordinates", "success": False}
            
            # Outdoor path between Hall exit and CC entrance
            outdoor_path = self.find_outdoor_path(
                f"{hall_exits[0]['lat']},{hall_exits[0]['lng']}", 
                f"{cc_entrances[0]['lat']},{cc_entrances[0]['lng']}",
                weather_data=weather_data
            )
            if not outdoor_path["success"]:
                return {"error": "Failed to find outdoor path between Hall and CC", "success": False}
            
            # Calculate total distance
            outdoor_distance = float(outdoor_path["routes"][0]["distance"].split()[0])
            total_distance = indoor_start_path["distance"] + outdoor_distance + indoor_end_path["distance"]
            
            # Create path segments
            segments = [
                self._create_indoor_segment(
                    indoor_start_path["path"],
                    indoor_start_path["distance"],
                    "hall"
                ),
                self._create_outdoor_segment(
                    outdoor_path["routes"][0],
                    outdoor_distance,
                    weather_data["success"] if weather_data else False
                ),
                self._create_indoor_segment(
                    indoor_end_path["path"],
                    indoor_end_path["distance"],
                    "cc"
                )
            ]
            
            return self._create_integrated_path(segments, total_distance)
        elif "cc" in start_location["id"] and "h1" in end_location["id"]:
            # From CC to Hall - requires going outdoors
            # Indoor path from start to exit in CC
            indoor_start_path = self.find_indoor_path(start_location["id"], "cc_entrance_main")
            if not indoor_start_path["success"]:
                return {"error": "Failed to find path to exit in CC", "success": False}
            
            # Indoor path from entrance in Hall to end
            indoor_end_path = self.find_indoor_path("h1_entrance", end_location["id"])
            if not indoor_end_path["success"]:
                # Try alternative entrance if the main entrance isn't found
                return {"error": "Failed to find path from entrance in Hall", "success": False}

            # Get the coordinates for CC exit and Hall entrance
            cc_exits = self._get_building_exits('cc')
            hall_entrances = self._get_building_entrances('hall')
            
            if not cc_exits or not hall_entrances:
                return {"error": "Missing building exit/entrance coordinates", "success": False}
            
            # Outdoor path between CC exit and Hall entrance
            outdoor_path = self.find_outdoor_path(
                f"{cc_exits[0]['lat']},{cc_exits[0]['lng']}", 
                f"{hall_entrances[0]['lat']},{hall_entrances[0]['lng']}",
                weather_data=weather_data
            )
            if not outdoor_path["success"]:
                return {"error": "Failed to find outdoor path between CC and Hall", "success": False}
            
            # Calculate total distance
            outdoor_distance = float(outdoor_path["routes"][0]["distance"].split()[0])
            total_distance = indoor_start_path["distance"] + outdoor_distance + indoor_end_path["distance"]
            
            # Create path segments
            segments = [
                self._create_indoor_segment(
                    indoor_start_path["path"],
                    indoor_start_path["distance"],
                    "cc"
                ),
                self._create_outdoor_segment(
                    outdoor_path["routes"][0],
                    outdoor_distance,
                    weather_data["success"] if weather_data else False
                ),
                self._create_indoor_segment(
                    indoor_end_path["path"],
                    indoor_end_path["distance"],
                    "hall"
                )
            ]
            
            return self._create_integrated_path(segments, total_distance)
        
        # For other cases, use the standard approach with exits
        # Get all exit points
        all_exits = self._get_all_exits()
        
        # Find the best combination of indoor and outdoor segments
        best_path = None
        best_total_distance = float('inf')
        
        for start_exit in all_exits:
            for end_exit in all_exits:
                # Skip if both exits are from the same building
                if (("h1" in start_exit["id"] and "h1" in end_exit["id"]) or
                    ("mb" in start_exit["id"] and "mb" in end_exit["id"]) or
                    ("cc" in start_exit["id"] and "cc" in end_exit["id"])):
                    continue
                
                # Indoor path from start to exit
                indoor_start_path = self.find_indoor_path(start_location["id"], start_exit["id"])
                if not indoor_start_path["success"]:
                    continue
                
                # Indoor path from entrance to end
                indoor_end_path = self.find_indoor_path(end_exit["id"], end_location["id"])
                if not indoor_end_path["success"]:
                    continue
                
                # Outdoor path between exits
                outdoor_path = self.find_outdoor_path(
                    f"{start_exit['lat']},{start_exit['lng']}", 
                    f"{end_exit['lat']},{end_exit['lng']}",
                    weather_data=weather_data
                )
                if not outdoor_path["success"]:
                    continue
                
                # Calculate total distance
                outdoor_distance = float(outdoor_path["routes"][0]["distance"].split()[0])
                total_distance = (
                    indoor_start_path["distance"] + 
                    outdoor_distance + 
                    indoor_end_path["distance"]
                )
                
                # If weather is bad, prioritize routes with shorter outdoor segments
                # but don't artificially inflate the distance
                if is_bad_weather and total_distance < best_total_distance * 1.2:  # Allow slightly longer routes if they have less outdoor time
                    best_total_distance = total_distance
                    
                    # Determine campus from node ID
                    start_campus = "hall" if "h1" in start_exit["id"] else "mb" if "mb" in start_exit["id"] else "cc"
                    end_campus = "hall" if "h1" in end_exit["id"] else "mb" if "mb" in end_exit["id"] else "cc"
                    
                    # Create path segments
                    segments = [
                        self._create_indoor_segment(
                            indoor_start_path["path"],
                            indoor_start_path["distance"],
                            start_campus
                        ),
                        self._create_outdoor_segment(
                            outdoor_path["routes"][0],
                            outdoor_distance,
                            weather_data["success"] if weather_data else False
                        ),
                        self._create_indoor_segment(
                            indoor_end_path["path"],
                            indoor_end_path["distance"],
                            end_campus
                        )
                    ]
                    
                    best_path = self._create_integrated_path(segments, best_total_distance)
                elif not is_bad_weather and total_distance < best_total_distance:
                    best_total_distance = total_distance
                    
                    # Determine campus from node ID
                    start_campus = "hall" if "h1" in start_exit["id"] else "mb" if "mb" in start_exit["id"] else "cc"
                    end_campus = "hall" if "h1" in end_exit["id"] else "mb" if "mb" in end_exit["id"] else "cc"
                    
                    # Create path segments
                    segments = [
                        self._create_indoor_segment(
                            indoor_start_path["path"],
                            indoor_start_path["distance"],
                            start_campus
                        ),
                        self._create_outdoor_segment(
                            outdoor_path["routes"][0],
                            outdoor_distance,
                            weather_data["success"] if weather_data else False
                        ),
                        self._create_indoor_segment(
                            indoor_end_path["path"],
                            indoor_end_path["distance"],
                            end_campus
                        )
                    ]
                    
                    best_path = self._create_integrated_path(segments, best_total_distance)
        
        if best_path:
            return best_path
        else:
            return {"error": "No valid path found", "success": False}
            
    def _get_all_exits(self) -> List[Dict[str, Any]]:
        """Get all exit points from all buildings"""
        all_exits = []
        all_exits.extend(self._get_building_exits("hall"))
        all_exits.extend(self._get_building_exits("mb"))
        all_exits.extend(self._get_building_exits("cc"))
        return all_exits
    
    def _find_mixed_path(self, start_location: Dict[str, Any], end_location: Dict[str, Any], 
                        weather_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Find a path when one location is indoor and the other is outdoor"""
        if start_location["type"] == "indoor":
            # Start is indoor, end is outdoor
            return self._find_indoor_to_outdoor_path(start_location, end_location, weather_data)
        else:
            # Start is outdoor, end is indoor
            return self._find_outdoor_to_indoor_path(start_location, end_location, weather_data)
    
    def _find_indoor_to_outdoor_path(self, start_location: Dict[str, Any], end_location: Dict[str, Any], 
                                    weather_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Find a path from an indoor location to an outdoor location"""
        # Determine campus from node ID
        campus = "hall" if "h1" in start_location["id"] else "mb" if "mb" in start_location["id"] else "cc"
        
        exits = self._get_building_exits(campus)
        
        best_path = None
        best_total_distance = float('inf')
        
        # Check if weather conditions suggest prioritizing indoor routes
        is_bad_weather = self._is_bad_weather(weather_data)
        
        for exit_point in exits:
            # Indoor path from start to exit
            indoor_path = self.find_indoor_path(start_location["id"], exit_point["id"])
            if not indoor_path["success"]:
                continue
            
            # Outdoor path from exit to end
            outdoor_path = self.find_outdoor_path(
                f"{exit_point['lat']},{exit_point['lng']}", 
                f"{end_location['lat']},{end_location['lng']}",
                weather_data=weather_data
            )
            if not outdoor_path["success"]:
                continue
            
            # Calculate total distance
            outdoor_distance = float(outdoor_path["routes"][0]["distance"].split()[0])
            total_distance = indoor_path["distance"] + outdoor_distance
            
            # If weather is bad, prioritize routes with shorter outdoor segments
            # but don't artificially inflate the distance
            if is_bad_weather and total_distance < best_total_distance * 1.2:  # Allow slightly longer routes if they have less outdoor time
                best_total_distance = total_distance
                
                # Create path segments
                segments = [
                    self._create_indoor_segment(
                        indoor_path["path"],
                        indoor_path["distance"],
                        campus
                    ),
                    self._create_outdoor_segment(
                        outdoor_path["routes"][0],
                        outdoor_distance,
                        weather_data["success"] if weather_data else False
                    )
                ]
                
                best_path = self._create_integrated_path(segments, best_total_distance)
            elif not is_bad_weather and total_distance < best_total_distance:
                best_total_distance = total_distance
                
                # Create path segments
                segments = [
                    self._create_indoor_segment(
                        indoor_path["path"],
                        indoor_path["distance"],
                        campus
                    ),
                    self._create_outdoor_segment(
                        outdoor_path["routes"][0],
                        outdoor_distance,
                        weather_data["success"] if weather_data else False
                    )
                ]
                
                best_path = self._create_integrated_path(segments, best_total_distance)
        
        if best_path:
            return best_path
        else:
            return {"error": "No valid path found", "success": False}
    
    def _find_outdoor_to_indoor_path(self, start_location: Dict[str, Any], end_location: Dict[str, Any], 
                                    weather_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Find a path from an outdoor location to an indoor location"""
        # Determine campus from node ID
        campus = "hall" if "h1" in end_location["id"] else "mb" if "mb" in end_location["id"] else "cc"
        
        entrances = self._get_building_entrances(campus)
        
        best_path = None
        best_total_distance = float('inf')
        
        # Check if weather conditions suggest prioritizing indoor routes
        is_bad_weather = self._is_bad_weather(weather_data)
        
        for entrance in entrances:
            # Outdoor path from start to entrance
            outdoor_path = self.find_outdoor_path(
                f"{start_location['lat']},{start_location['lng']}", 
                f"{entrance['lat']},{entrance['lng']}",
                weather_data=weather_data
            )
            if not outdoor_path["success"]:
                continue
            
            # Indoor path from entrance to end
            indoor_path = self.find_indoor_path(entrance["id"], end_location["id"])
            if not indoor_path["success"]:
                continue
            
            # Calculate total distance
            outdoor_distance = float(outdoor_path["routes"][0]["distance"].split()[0])
            total_distance = outdoor_distance + indoor_path["distance"]
            
            # If weather is bad, prioritize routes with shorter outdoor segments
            # but don't artificially inflate the distance
            if is_bad_weather and total_distance < best_total_distance * 1.2:  # Allow slightly longer routes if they have less outdoor time
                best_total_distance = total_distance
                
                # Create path segments
                segments = [
                    self._create_outdoor_segment(
                        outdoor_path["routes"][0],
                        outdoor_distance,
                        weather_data["success"] if weather_data else False
                    ),
                    self._create_indoor_segment(
                        indoor_path["path"],
                        indoor_path["distance"],
                        campus
                    )
                ]
                
                best_path = self._create_integrated_path(segments, best_total_distance)
            elif not is_bad_weather and total_distance < best_total_distance:
                best_total_distance = total_distance
                
                # Create path segments
                segments = [
                    self._create_outdoor_segment(
                        outdoor_path["routes"][0],
                        outdoor_distance,
                        weather_data["success"] if weather_data else False
                    ),
                    self._create_indoor_segment(
                        indoor_path["path"],
                        indoor_path["distance"],
                        campus
                    )
                ]
                
                best_path = self._create_integrated_path(segments, best_total_distance)
        
        if best_path:
            return best_path
        else:
            return {"error": "No valid path found", "success": False}
    
    def _get_building_exits(self, campus: str) -> List[Dict[str, Any]]:
        """Get exit points for a building"""
        # Use the same entrances as exits
        return self._get_building_entrances(campus)
    
    def _get_building_entrances(self, campus: str) -> List[Dict[str, Any]]:
        """Get entrance points for a building"""
        # This would be defined in your data
        # For now, return a placeholder
        if campus == "hall":
            return [
                {"id": "h1_entrance"," lat": 45.4972, "lng": -73.5790},
            ]
        elif campus == "mb":
            return [
                {"id": "mb_1_entrance_1", "lat": 45.4950, "lng": -73.5780},
                {"id": "mb_1_entrance_2", "lat": 45.4955, "lng": -73.5775}
            ]
        elif campus == "cc":
            return [
                {"id": "cc_entrance_main", "lat": 45.4960, "lng": -73.5770},
            ]
        else:
            return []
    
    def generate_route_with_weather(self, start_location: Dict[str, Any], end_location: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a route considering weather conditions using ChatGPT"""
        # Get weather data for the outdoor segments
        weather_data = None
        if start_location["type"] == "outdoor" or end_location["type"] == "outdoor":
            # Use the midpoint for weather data
            mid_lat = (start_location.get("lat", 0) + end_location.get("lat", 0)) / 2
            mid_lng = (start_location.get("lng", 0) + end_location.get("lng", 0)) / 2
            weather_data = self.get_weather_for_location(mid_lat, mid_lng)
        
        # Find the integrated path
        path_result = self.find_integrated_path(start_location, end_location, weather_data)
        
        if not path_result["success"]:
            return {
                "error": path_result.get("error", "Failed to find a route"),
                "success": False
            }
        
        # Generate human-readable instructions using ChatGPT
        try:
            prompt = self._create_route_prompt(path_result, weather_data)
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful navigation assistant that provides clear, concise directions."},
                    {"role": "user", "content": prompt}
                ]
            )
            
            instructions = response.choices[0].message.content
            
            return {
                "path": path_result,
                "instructions": instructions,
                "weather_data": weather_data,
                "success": True
            }
        except Exception as e:
            # If ChatGPT fails, return the path without instructions
            return {
                "path": path_result,
                "error": f"Failed to generate instructions: {str(e)}",
                "weather_data": weather_data,
                "success": True
            }
    
    def _create_route_prompt(self, path_result: Dict[str, Any], weather_data: Optional[Dict[str, Any]]) -> str:
        """Create a prompt for ChatGPT to generate route instructions"""
        prompt = "Generate clear, step-by-step navigation instructions for the following route:\n\n"
        
        if path_result["type"] == "integrated":
            for i, segment in enumerate(path_result["segments"]):
                if segment["type"] == "indoor":
                    prompt += f"Indoor segment {i+1} (in {segment['campus']} building):\n"
                    prompt += f"- Distance: {segment['distance']} meters\n"
                    prompt += f"- Path: {' → '.join(segment['path'])}\n\n"
                elif segment["type"] == "outdoor":
                    prompt += f"Outdoor segment {i+1}:\n"
                    prompt += f"- Distance: {segment['distance']} meters\n"
                    prompt += f"- Duration: {segment['path']['duration']}\n"
                    prompt += f"- Steps: {len(segment['path']['steps'])}\n\n"
        else:
            prompt += f"Single segment route:\n"
            prompt += f"- Type: {path_result['type']}\n"
            prompt += f"- Distance: {path_result.get('distance', 'N/A')} meters\n\n"
        
        if weather_data and weather_data["success"]:
            prompt += f"Weather conditions:\n"
            prompt += f"- Temperature: {weather_data['temperature']}°C\n"
            prompt += f"- Precipitation: {weather_data['precipitation']}\n"
            prompt += f"- Weather Code: {weather_data['weather_code']}\n"
            prompt += f"- Wind Speed: {weather_data['wind_speed']} m/s\n\n"
        
        prompt += "Please provide clear, step-by-step instructions for navigating this route, including any weather considerations."
         
        return prompt 
    def find_path_evan(self, start_location: str, end_location: Dict[str, Any]) -> Dict[str, Any]:
        """Find a path between two locations using the integrated routing service"""
        start_node = self.indoor_graph.get_node_by_id(start_location)
        end_node = self.indoor_graph.get_node_by_id(end_location)

       


        if start_node is None or end_node is None:
            return {"error": "Invalid start or end location", "success": False}
        
        if start_node["id"].startswith("h"):
            exit_node = self.indoor_graph.get_node_by_id("h1_entrance")
            if exit_node is None:
                return {"error": "Failed to find exit node", "success": False}
            path = self.indoor_graph.find_shortest_path(exit_node, end_node)
            if path is None:
                return {"error": "Failed to find path", "success": False}
            return path
        # Find the shortest path between the two nodes
        path = self.find_shortest_path(start_node, end_node)

        return self.find_integrated_path(start_location, end_location)
    
    
if __name__ == "__main__":
    
    integrated_routing = IntegratedRoutingService()
    start_location = {"id": "h1_110", "type": "indoor"}
    end_location = { "type": "indoor", "id": "cc_102"}
    result = integrated_routing.generate_route_with_weather(start_location, end_location)
    print(result)
