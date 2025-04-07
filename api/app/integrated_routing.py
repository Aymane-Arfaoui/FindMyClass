import os
import json
import requests
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from .graph.Graph2 import Graph
from openaiHelper.getWeather import get_weather
from openai import OpenAI
from dotenv import load_dotenv

class IntegratedRoutingService:
    def __init__(self):
        self.indoor_graphs = {}
        self.accessibility_graphs = {}
        self._initialize_graphs()
        load_dotenv()
        self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
    def _initialize_graphs(self):
        """Initialize graphs for all campuses"""
        current_dir = Path(os.getcwd())
        if 'api' not in current_dir.parts:
            current_dir = current_dir / 'api'
        
        base_path = current_dir / 'app/data/campus_jsons'
        for campus in ['hall', 'mb', 'cc']:
            campus_path = base_path / campus
            if campus_path.exists():
                self.indoor_graphs[campus] = Graph()
                self.indoor_graphs[campus].load_from_json_folder(str(campus_path))
    
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
    
    def find_indoor_path(self, start_id: str, end_id: str, campus: str = 'hall', accessibility: bool = False) -> Dict[str, Any]:
        """Find the shortest path between two indoor locations"""
        if campus not in self.indoor_graphs:
            return {"error": f"Campus {campus} not found", "success": False}
        
        graph_to_use = self.indoor_graphs[campus]
        if accessibility:
            if campus not in self.accessibility_graphs:
                self.accessibility_graphs[campus] = Graph()
                self.accessibility_graphs[campus].graph = self._get_sub_graph(self.indoor_graphs[campus])
            graph_to_use = self.accessibility_graphs[campus]
        
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
        nx_graph = graph.graph
        allowed_edges = set(nx_graph.edges())

        # Remove escalator and stairs edges
        for edge in nx_graph.edges():
            if "escalator" in edge[0] or "stairs" in edge[0] or "escalator" in edge[1] or "stairs" in edge[1]:
                allowed_edges.remove(edge)

        # Create a subgraph with allowed edges only
        return nx_graph.edge_subgraph(allowed_edges).copy()
    
    def find_outdoor_path(self, origin: str, destination: str, mode: str = "walking", weather_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Find the shortest path between two outdoor locations using Google Maps API"""
        try:
            import requests
            import polyline
            from config import GOOGLE_MAPS_API_KEY
            
            # Adjust mode based on weather conditions
            # if self._is_bad_weather(weather_data) and mode == "walking":
            #     mode = "transit"
            
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
            start_location: Dict with keys 'id', 'type' ('indoor' or 'outdoor'), 'campus' (for indoor), 'lat', 'lng' (for outdoor)
            end_location: Same structure as start_location
            weather_data: Optional weather data to consider in route planning
        """
        # If both locations are indoor, use indoor routing
        if start_location["type"] == "indoor" and end_location["type"] == "indoor":
            if start_location["campus"] == end_location["campus"]:
                return self.find_indoor_path(start_location["id"], end_location["id"], start_location["campus"])
            else:
                # Different buildings, need to go outside
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
        
        # Special case for Hall and JMSB (MB) buildings during bad weather
        if is_bad_weather and (
            (start_location["campus"] == "hall" and end_location["campus"] == "mb") or
            (start_location["campus"] == "mb" and end_location["campus"] == "hall")
        ):
            # Use the tunnel in Hall and metro entrance in JMSB S2
            if start_location["campus"] == "hall":
                # From Hall to JMSB
                # Indoor path from start to tunnel in Hall
                indoor_start_path = self.find_indoor_path(start_location["id"], "h1_tunnel_entrance", start_location["campus"])
                if not indoor_start_path["success"]:
                    return {"error": "Failed to find path to tunnel in Hall", "success": False}
                
                # Indoor path from metro entrance in JMSB S2 to end
                indoor_end_path = self.find_indoor_path("mb_s2_metro_entrance", end_location["id"], end_location["campus"])
                if not indoor_end_path["success"]:
                    return {"error": "Failed to find path from metro entrance in JMSB", "success": False}
                
                # Create path segments
                segments = [
                    self._create_indoor_segment(
                        indoor_start_path["path"],
                        indoor_start_path["distance"],
                        start_location["campus"]
                    ),
                    self._create_indoor_segment(
                        ["h1_tunnel_entrance", "mb_s2_metro_entrance"],  # Tunnel path
                        50.0,  # Approximate distance through tunnel
                        "tunnel"
                    ),
                    self._create_indoor_segment(
                        indoor_end_path["path"],
                        indoor_end_path["distance"],
                        end_location["campus"]
                    )
                ]
                
                total_distance = indoor_start_path["distance"] + 50.0 + indoor_end_path["distance"]
                return self._create_integrated_path(segments, total_distance)
            else:
                # From JMSB to Hall
                # Indoor path from start to metro entrance in JMSB S2
                indoor_start_path = self.find_indoor_path(start_location["id"], "mb_s2_metro_entrance", start_location["campus"])
                if not indoor_start_path["success"]:
                    return {"error": "Failed to find path to metro entrance in JMSB", "success": False}
                
                # Indoor path from tunnel in Hall to end
                indoor_end_path = self.find_indoor_path("h1_tunnel_entrance", end_location["id"], end_location["campus"])
                if not indoor_end_path["success"]:
                    return {"error": "Failed to find path from tunnel in Hall", "success": False}
                
                # Create path segments
                segments = [
                    self._create_indoor_segment(
                        indoor_start_path["path"],
                        indoor_start_path["distance"],
                        start_location["campus"]
                    ),
                    self._create_indoor_segment(
                        ["mb_s2_metro_entrance", "h1_tunnel_entrance"],  # Tunnel path
                        50.0,  # Approximate distance through tunnel
                        "tunnel"
                    ),
                    self._create_indoor_segment(
                        indoor_end_path["path"],
                        indoor_end_path["distance"],
                        end_location["campus"]
                    )
                ]
                
                total_distance = indoor_start_path["distance"] + 50.0 + indoor_end_path["distance"]
                return self._create_integrated_path(segments, total_distance)
        
        # For other cases or good weather, use the standard approach
        # Get building exit points
        start_exits = self._get_building_exits(start_location["campus"])
        end_exits = self._get_building_exits(end_location["campus"])
        
        # Find the best combination of indoor and outdoor segments
        best_path = None
        best_total_distance = float('inf')
        
        for start_exit in start_exits:
            for end_exit in end_exits:
                # Indoor path from start to exit
                indoor_start_path = self.find_indoor_path(start_location["id"], start_exit["id"], start_location["campus"])
                if not indoor_start_path["success"]:
                    continue
                
                # Indoor path from entrance to end
                indoor_end_path = self.find_indoor_path(end_exit["id"], end_location["id"], end_location["campus"])
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
                    
                    # Create path segments
                    segments = [
                        self._create_indoor_segment(
                            indoor_start_path["path"],
                            indoor_start_path["distance"],
                            start_location["campus"]
                        ),
                        self._create_outdoor_segment(
                            outdoor_path["routes"][0],
                            outdoor_distance,
                            weather_data["success"] if weather_data else False
                        ),
                        self._create_indoor_segment(
                            indoor_end_path["path"],
                            indoor_end_path["distance"],
                            end_location["campus"]
                        )
                    ]
                    
                    best_path = self._create_integrated_path(segments, best_total_distance)
                elif not is_bad_weather and total_distance < best_total_distance:
                    best_total_distance = total_distance
                    
                    # Create path segments
                    segments = [
                        self._create_indoor_segment(
                            indoor_start_path["path"],
                            indoor_start_path["distance"],
                            start_location["campus"]
                        ),
                        self._create_outdoor_segment(
                            outdoor_path["routes"][0],
                            outdoor_distance,
                            weather_data["success"] if weather_data else False
                        ),
                        self._create_indoor_segment(
                            indoor_end_path["path"],
                            indoor_end_path["distance"],
                            end_location["campus"]
                        )
                    ]
                    
                    best_path = self._create_integrated_path(segments, best_total_distance)
        
        if best_path:
            return best_path
        else:
            return {"error": "No valid path found", "success": False}
    
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
        exits = self._get_building_exits(start_location["campus"])
        
        best_path = None
        best_total_distance = float('inf')
        
        # Check if weather conditions suggest prioritizing indoor routes
        is_bad_weather = self._is_bad_weather(weather_data)
        
        for exit_point in exits:
            # Indoor path from start to exit
            indoor_path = self.find_indoor_path(start_location["id"], exit_point["id"], start_location["campus"])
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
                        start_location["campus"]
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
                        start_location["campus"]
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
        entrances = self._get_building_entrances(end_location["campus"])
        
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
            indoor_path = self.find_indoor_path(entrance["id"], end_location["id"], end_location["campus"])
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
                        end_location["campus"]
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
                        end_location["campus"]
                    )
                ]
                
                best_path = self._create_integrated_path(segments, best_total_distance)
        
        if best_path:
            return best_path
        else:
            return {"error": "No valid path found", "success": False}
    
    def _get_building_exits(self, campus: str) -> List[Dict[str, Any]]:
        """Get exit points for a building"""
        # This would be defined in your data
        # For now, return a placeholder
        if campus == "hall":
            return [
                {"id": "h1_exit_main", "lat": 45.4972, "lng": -73.5790},
                {"id": "h1_exit_side", "lat": 45.4975, "lng": -73.5785}
            ]
        elif campus == "mb":
            return [
                {"id": "mb1_exit_main", "lat": 45.4950, "lng": -73.5780},
                {"id": "mb1_exit_side", "lat": 45.4955, "lng": -73.5775}
            ]
        else:
            return []
    
    def _get_building_entrances(self, campus: str) -> List[Dict[str, Any]]:
        """Get entrance points for a building"""
        # This would be defined in your data
        # For now, return a placeholder
        if campus == "hall":
            return [
                {"id": "h1_entrance_main", "lat": 45.4972, "lng": -73.5790},
                {"id": "h1_entrance_side", "lat": 45.4975, "lng": -73.5785}
            ]
        elif campus == "mb":
            return [
                {"id": "mb1_entrance_main", "lat": 45.4950, "lng": -73.5780},
                {"id": "mb1_entrance_side", "lat": 45.4955, "lng": -73.5775}
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