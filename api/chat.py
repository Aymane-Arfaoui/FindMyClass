import os
from openai import OpenAI
from dotenv import load_dotenv
from app.aiapi import AINavigationAPI
from app.integrated_routing import IntegratedRoutingService
import re

class NavigationContext:
    def __init__(self):
        self.last_navigation = None
        self.last_start_room = None
        self.last_end_room = None
        self.last_weather_data = None

# Initialize global context
nav_context = NavigationContext()
routing_service = IntegratedRoutingService()

def is_navigation_query(query: str) -> bool:
    """Check if the query is asking for directions"""
    navigation_keywords = [
        "how do i get", "how to get", "where is", "directions to",
        "path to", "route to", "way to", "navigate to", "go from",
        "to", "from", "how long", "time", "distance"
    ]
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in navigation_keywords)

def extract_rooms(query: str) -> tuple:
    """Extract room numbers from the query"""
    # Look for patterns like H-102, H 102, H102, H_102
    pattern = r'[h][-_ ]?(\d{3})'
    rooms = re.findall(pattern, query.lower())
    if len(rooms) >= 2:
        # Get floor numbers from room numbers
        start_floor = rooms[0][0]  # First digit is floor number
        end_floor = rooms[1][0]    # First digit is floor number
        
        # Format room IDs for the navigation system
        start_room = f"h{start_floor}_{rooms[0]}"
        end_room = f"h{end_floor}_{rooms[1]}"
        return start_room, end_room
    return None, None

def interpret_path(path_info: dict) -> str:
    """Convert path information into human-readable instructions"""
    if not path_info or "error" in path_info:
        return path_info.get("error", "Could not find a path between these rooms.")
    
    path = path_info.get("path", [])
    distance = path_info.get("distance", 0)
    
    if not path:
        return "No path found between these rooms."
    
    instructions = ["Here's how to get to your destination:"]
    
    for i in range(len(path) - 1):
        current = path[i]
        next_node = path[i + 1]
        
        # Extract building, floor, and room/hallway info
        current_parts = current.split('_')
        next_parts = next_node.split('_')
        
        # Get building and floor info
        current_building = current_parts[0][0].upper()  # 'h' from 'h1'
        current_floor = current_parts[0][1]            # '1' from 'h1'
        next_building = next_parts[0][0].upper()
        next_floor = next_parts[0][1]
        
        # Check node types
        current_is_hallway = len(current_parts) > 1 and current_parts[1].startswith('hw')
        next_is_hallway = len(next_parts) > 1 and next_parts[1].startswith('hw')
        current_is_elevator = 'elevator' in current
        next_is_elevator = 'elevator' in next_node
        current_is_stairs = 'stairs' in current
        next_is_stairs = 'stairs' in next_node
        current_is_escalator = 'escalator' in current
        next_is_escalator = 'escalator' in next_node
        
        # Handle special nodes
        if current_is_elevator and next_is_elevator:
            instructions.append(f"Take the elevator from floor {current_floor} to floor {next_floor}")
        elif current_is_stairs and next_is_stairs:
            instructions.append(f"Take the stairs from floor {current_floor} to floor {next_floor}")
        elif current_is_escalator and next_is_escalator:
            instructions.append(f"Take the escalator from floor {current_floor} to floor {next_floor}")
        elif current_is_hallway and next_is_hallway:
            instructions.append(f"Continue through the hallway on floor {current_floor}")
        elif current_is_hallway:
            room_num = next_parts[-1]
            if next_is_elevator:
                instructions.append(f"Look for the elevator along the hallway")
            elif next_is_stairs:
                instructions.append(f"Look for the stairs along the hallway")
            elif next_is_escalator:
                instructions.append(f"Look for the escalator along the hallway")
            else:
                instructions.append(f"Look for room {next_building}-{room_num} along the hallway")
        elif next_is_hallway:
            current_num = current_parts[-1]
            if current_is_elevator:
                instructions.append(f"Exit the elevator and enter the hallway")
            elif current_is_stairs:
                instructions.append(f"Exit the stairs and enter the hallway")
            elif current_is_escalator:
                instructions.append(f"Exit the escalator and enter the hallway")
            else:
                instructions.append(f"Exit room {current_building}-{current_num} and enter the hallway")
        else:
            current_num = current_parts[-1]
            next_num = next_parts[-1]
            if current_is_elevator:
                instructions.append(f"Exit the elevator and go to room {next_building}-{next_num}")
            elif current_is_stairs:
                instructions.append(f"Exit the stairs and go to room {next_building}-{next_num}")
            elif current_is_escalator:
                instructions.append(f"Exit the escalator and go to room {next_building}-{next_num}")
            else:
                instructions.append(f"Go from room {current_building}-{current_num} to room {next_building}-{next_num}")
    
    instructions.append(f"\nTotal distance: {distance:.1f} meters")
    return "\n".join(instructions)

def handle_follow_up(query: str, context: NavigationContext) -> str:
    """Handle follow-up questions about the last navigation"""
    if not context.last_navigation:
        return "I don't have any previous navigation information. Please ask for directions first."
    
    query_lower = query.lower()
    
    if any(word in query_lower for word in ["how long", "time", "distance"]):
        if context.last_navigation.get("type") == "integrated":
            total_distance = context.last_navigation.get("total_distance", 0)
        else:
            total_distance = context.last_navigation.get("distance", 0)
        
        # Assuming average walking speed of 1.4 m/s
        time_minutes = (total_distance / 1.4) / 60
        return f"The distance is {total_distance:.1f} meters, which should take about {time_minutes:.1f} minutes to walk."
    
    if "weather" in query_lower and context.last_weather_data:
        if context.last_weather_data["success"]:
            temp = context.last_weather_data["temperature"]
            return f"The current temperature is {temp}°C. This may affect your route if you need to go outside."
        else:
            return "I couldn't retrieve the weather data for your route."
    
    return "I'm not sure what you're asking about. Could you please rephrase your question?"

def extract_locations(query: str) -> tuple:
    """Extract indoor and outdoor locations from the query"""
    # Look for indoor locations (room numbers)
    indoor_pattern = r'[h][-_ ]?(\d{3})'
    rooms = re.findall(indoor_pattern, query.lower())
    
    # Look for outdoor locations (coordinates or place names)
    # This is a simplified pattern and would need to be enhanced for real-world use
    outdoor_pattern = r'at\s+([\d\.-]+),\s*([\d\.-]+)'
    outdoor_matches = re.findall(outdoor_pattern, query)
    
    start_location = None
    end_location = None
    
    # Process indoor locations
    if len(rooms) >= 2:
        start_floor = rooms[0][0]
        end_floor = rooms[1][0]
        start_room = f"h{start_floor}_{rooms[0]}"
        end_room = f"h{end_floor}_{rooms[1]}"
        
        start_location = {
            "type": "indoor",
            "id": start_room,
            "campus": "hall"
        }
        
        end_location = {
            "type": "indoor",
            "id": end_room,
            "campus": "hall"
        }
    
    # Process outdoor locations
    if outdoor_matches:
        if len(outdoor_matches) >= 2:
            start_lat, start_lng = outdoor_matches[0]
            end_lat, end_lng = outdoor_matches[1]
            
            start_location = {
                "type": "outdoor",
                "lat": float(start_lat),
                "lng": float(start_lng)
            }
            
            end_location = {
                "type": "outdoor",
                "lat": float(end_lat),
                "lng": float(end_lng)
            }
        elif len(outdoor_matches) == 1 and start_location:
            # One outdoor location and one indoor location
            lat, lng = outdoor_matches[0]
            
            if start_location["type"] == "indoor":
                end_location = {
                    "type": "outdoor",
                    "lat": float(lat),
                    "lng": float(lng)
                }
            else:
                start_location = {
                    "type": "outdoor",
                    "lat": float(lat),
                    "lng": float(lng)
                }
    
    return start_location, end_location

def main():
    # Load environment variables
    load_dotenv()
    
    # Initialize OpenAI client and Navigation API
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    nav_api = AINavigationAPI()
    
    print("Welcome to the Concordia Indoor Navigation Assistant!")
    print("I can help you find your way around Concordia's buildings, especially the EV, H, and MB buildings.")
    print("Type 'exit' to quit")
    print("Type 'help' for available commands")
    
    while True:
        try:
            # Get user input
            user_input = input("\nYou: ").strip()
            
            # Check for exit command
            if user_input.lower() == 'exit':
                print("Goodbye! Good luck with your studies at Concordia!")
                break
                
            # Check for help command
            if user_input.lower() == 'help':
                print("\nAvailable commands:")
                print("- help: Show this help message")
                print("- exit: Exit the program")
                print("- You can ask me about:")
                print("  * Finding specific rooms (e.g., 'How do I get from H-109 to H-110?' or simply 'H109 to H110')")
                print("  * Finding routes between indoor and outdoor locations (e.g., 'How do I get from H-109 to 45.4972,-73.5790?')")
                print("  * Building layouts (e.g., 'What's on the 9th floor of EV?')")
                print("  * Navigation tips (e.g., 'How do I get from EV to H building?')")
                print("  * Accessibility information (e.g., 'Are there elevators in the MB building?')")
                continue
            
            # Check if this is a navigation query
            if is_navigation_query(user_input):
                # If we have a previous navigation and the query is a follow-up
                if nav_context.last_navigation and not any(word in user_input.lower() for word in ["from", "to", "get"]):
                    response_text = handle_follow_up(user_input, nav_context)
                    print("\nConcordia Assistant:", response_text)
                    continue
                
                # Try to extract indoor and outdoor locations
                start_location, end_location = extract_locations(user_input)
                
                if start_location and end_location:
                    # Use integrated routing service
                    result = routing_service.generate_route_with_weather(start_location, end_location)
                    
                    if result["success"]:
                        nav_context.last_navigation = result["path"]
                        nav_context.last_weather_data = result.get("weather_data")
                        
                        # If we have instructions from ChatGPT, use them
                        if "instructions" in result:
                            response_text = result["instructions"]
                        else:
                            # Fall back to basic interpretation
                            if result["path"]["type"] == "indoor":
                                response_text = interpret_path(result["path"])
                            else:
                                response_text = "I found a route for you, but couldn't generate detailed instructions."
                    else:
                        response_text = result.get("error", "Could not find a route between these locations.")
                    
                    print("\nConcordia Assistant:", response_text)
                    continue
                
                # Fall back to basic indoor navigation
                start_room, end_room = extract_rooms(user_input)
                if start_room and end_room:
                    # Use navigation API to find path
                    path_info = nav_api.find_shortest_path(start_room, end_room)
                    response_text = interpret_path(path_info)
                    if "error" not in path_info:
                        nav_context.last_navigation = path_info
                        nav_context.last_start_room = start_room
                        nav_context.last_end_room = end_room
                    print("\nConcordia Assistant:", response_text)
                    continue
            
            # Use OpenAI for general queries or if location extraction failed
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": """You are a helpful Concordia University indoor navigation assistant. 
                    You have knowledge about Concordia's buildings, especially the EV, H, and MB buildings.
                    You can help students find their way around campus, locate specific rooms, and provide navigation tips.
                    Be friendly and specific in your responses, and mention relevant building codes and room numbers when applicable.
                    For specific room-to-room navigation, suggest using the format 'H109 to H110' or 'How do I get from H-109 to H-110?'
                    You can also help with routes that include both indoor and outdoor segments, considering weather conditions."""},
                    {"role": "user", "content": user_input}
                ]
            )
            
            print("\nConcordia Assistant:", response.choices[0].message.content)
            
        except KeyboardInterrupt:
            print("\nGoodbye! Good luck with your studies at Concordia!")
            break
        except Exception as e:
            print(f"\nError: {str(e)}")

if __name__ == "__main__":
    main() 